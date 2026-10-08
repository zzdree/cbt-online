import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureQuestionBankSchema } from '@/lib/ensure-bank';
import crypto from 'node:crypto';

// Menyimpan sekaligus butir hasil review AI ke dalam bank soal.
export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    await ensureQuestionBankSchema();

    const { bank_id, questions } = await req.json();

    if (!bank_id || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'bank_id dan daftar soal wajib diisi' }, { status: 400 });
    }

    const bank = (await db
      .prepare('SELECT id FROM question_banks WHERE id = ?')
      .get(bank_id)) as { id: string } | null;
    if (!bank) {
      return NextResponse.json({ error: 'Bank soal tidak ditemukan' }, { status: 404 });
    }

    const maxOrder = (await db
      .prepare('SELECT COALESCE(MAX(order_index), 0) AS max_order FROM question_bank_items WHERE bank_id = ?')
      .get(bank_id)) as { max_order: number };

    let orderIndex = maxOrder?.max_order || 0;
    let imported = 0;

    for (const q of questions) {
      if (!String(q.question_text || '').trim()) continue;

      const itemId = `bankitem_${crypto.randomUUID().slice(0, 8)}`;
      orderIndex += 1;

      await db.prepare(
        `INSERT INTO question_bank_items (id, bank_id, order_index, question_text, image_url, points, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        itemId,
        bank_id,
        orderIndex,
        q.question_text,
        q.image_url || null,
        Number(q.points) || 10,
        q.explanation || null
      );

      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (!opt.key || !String(opt.text || '').trim()) continue;
          await db.prepare(
            `INSERT INTO question_bank_item_options (id, item_id, option_key, option_text, image_url, is_correct)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(
            `${itemId}_${opt.key}`,
            itemId,
            opt.key,
            opt.text,
            opt.image_url || null,
            opt.is_correct ? 1 : 0
          );
        }
      }

      imported += 1;
    }

    if (imported === 0) {
      return NextResponse.json({ error: 'Tidak ada soal yang bisa disimpan' }, { status: 400 });
    }

    return NextResponse.json({ success: true, imported });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
