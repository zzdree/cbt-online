import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function POST(req: NextRequest) {
  const db = getDb();
  try {
    const body = await req.json();
    const { exam_id, questions } = body;

    if (!exam_id || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'exam_id dan daftar soal wajib diisi' }, { status: 400 });
    }

    const maxOrderRow = db
      .prepare('SELECT COALESCE(MAX(order_index), 0) as max_order FROM questions WHERE exam_id = ?')
      .get(exam_id) as { max_order: number };

    let orderIndex = (maxOrderRow?.max_order || 0);
    let importedCount = 0;

    // Use a transaction for atomicity
    db.exec('BEGIN');
    try {
      for (const q of questions) {
        if (!q.question_text?.trim()) continue;

        const questionId = `q_${crypto.randomUUID().slice(0, 8)}`;
        orderIndex += 1;

        db.prepare(
          'INSERT INTO questions (id, exam_id, order_index, question_text, image_url, points, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(
          questionId,
          exam_id,
          orderIndex,
          q.question_text,
          q.image_url || null,
          Number(q.points) || 10,
          q.explanation || null
        );

        if (Array.isArray(q.options)) {
          for (const opt of q.options) {
            if (!opt.key || !opt.text) continue;
            db.prepare(
              'INSERT INTO question_options (id, question_id, option_key, option_text, image_url, is_correct) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(
              `${questionId}_${opt.key}`,
              questionId,
              opt.key,
              opt.text,
              opt.image_url || null,
              opt.is_correct ? 1 : 0
            );
          }
        }

        importedCount += 1;
      }

      db.exec('COMMIT');
    } catch (txErr: any) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    return NextResponse.json({ success: true, imported: importedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
