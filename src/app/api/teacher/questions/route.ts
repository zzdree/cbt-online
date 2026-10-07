import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('exam_id');

    if (!examId) {
      return NextResponse.json({ error: 'exam_id wajib diisi' }, { status: 400 });
    }

    const questions = db
      .prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY order_index ASC')
      .all(examId) as any[];

    const result = questions.map((q) => {
      const options = db
        .prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY option_key ASC')
        .all(q.id);
      return { ...q, options };
    });

    return NextResponse.json({ questions: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const db = getDb();
  try {
    const body = await req.json();
    const { id, exam_id, question_text, image_url, points, explanation, options } = body;

    if (!exam_id || !question_text?.trim()) {
      return NextResponse.json({ error: 'exam_id dan narasi soal wajib diisi' }, { status: 400 });
    }

    if (!options || options.length < 2) {
      return NextResponse.json({ error: 'Minimal 2 pilihan jawaban wajib diisi' }, { status: 400 });
    }

    const hasCorrect = options.some((o: any) => o.is_correct === 1);
    if (!hasCorrect) {
      return NextResponse.json({ error: 'Wajib memilih minimal satu kunci jawaban yang benar' }, { status: 400 });
    }

    let questionId = id;

    if (id) {
      // Update existing question
      const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
      if (!existing) {
        return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 });
      }

      db.prepare(
        'UPDATE questions SET question_text = ?, image_url = ?, points = ?, explanation = ? WHERE id = ?'
      ).run(question_text, image_url || null, Number(points) || 10, explanation || null, id);

      // Replace options: delete old, insert new
      db.prepare('DELETE FROM question_options WHERE question_id = ?').run(id);
    } else {
      // Create new question
      questionId = `q_${crypto.randomUUID().slice(0, 8)}`;
      const maxOrder = db
        .prepare('SELECT COALESCE(MAX(order_index), 0) as max_order FROM questions WHERE exam_id = ?')
        .get(exam_id) as { max_order: number };

      db.prepare(
        'INSERT INTO questions (id, exam_id, order_index, question_text, image_url, points, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        questionId,
        exam_id,
        (maxOrder?.max_order || 0) + 1,
        question_text,
        image_url || null,
        Number(points) || 10,
        explanation || null
      );
    }

    for (const opt of options) {
      db.prepare(
        'INSERT INTO question_options (id, question_id, option_key, option_text, image_url, is_correct) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        `${questionId}_${opt.option_key}`,
        questionId,
        opt.option_key,
        opt.option_text,
        opt.image_url || null,
        opt.is_correct ? 1 : 0
      );
    }

    return NextResponse.json({ success: true, id: questionId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id soal wajib diisi' }, { status: 400 });
    }

    db.prepare('DELETE FROM question_options WHERE question_id = ?').run(id);
    db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
