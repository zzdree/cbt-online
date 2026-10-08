import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureQuestionBankSchema } from '@/lib/ensure-bank';
import crypto from 'node:crypto';

// Menyalin butir dari bank soal ke suatu ujian. Ujian menyimpan salinan, sehingga
// bank tetap bisa diperbarui tanpa mengubah ujian yang sudah dikerjakan siswa.
export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    await ensureQuestionBankSchema();

    const { exam_id, item_ids } = await req.json();

    if (!exam_id || !Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json({ error: 'exam_id dan daftar butir soal wajib diisi' }, { status: 400 });
    }

    const exam = (await db.prepare('SELECT id FROM exams WHERE id = ?').get(exam_id)) as {
      id: string;
    } | null;
    if (!exam) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 });
    }

    const maxOrder = (await db
      .prepare('SELECT COALESCE(MAX(order_index), 0) AS max_order FROM questions WHERE exam_id = ?')
      .get(exam_id)) as { max_order: number };

    let orderIndex = maxOrder?.max_order || 0;
    let copiedCount = 0;

    for (const itemId of item_ids) {
      const item = (await db
        .prepare('SELECT * FROM question_bank_items WHERE id = ?')
        .get(itemId)) as any;
      if (!item) continue;

      const options = (await db
        .prepare('SELECT * FROM question_bank_item_options WHERE item_id = ?')
        .all(itemId)) as any[];

      const questionId = `q_${crypto.randomUUID().slice(0, 8)}`;
      orderIndex += 1;

      await db.prepare(
        `INSERT INTO questions (id, exam_id, order_index, question_text, image_url, points, explanation, source_bank_item_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        questionId,
        exam_id,
        orderIndex,
        item.question_text,
        item.image_url || null,
        Number(item.points) || 10,
        item.explanation || null,
        item.id
      );

      for (const opt of options) {
        await db.prepare(
          `INSERT INTO question_options (id, question_id, option_key, option_text, image_url, is_correct)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          `${questionId}_${opt.option_key}`,
          questionId,
          opt.option_key,
          opt.option_text,
          opt.image_url || null,
          opt.is_correct ? 1 : 0
        );
      }

      copiedCount += 1;
    }

    if (copiedCount === 0) {
      return NextResponse.json({ error: 'Tidak ada butir soal yang bisa disalin' }, { status: 400 });
    }

    return NextResponse.json({ success: true, copied: copiedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
