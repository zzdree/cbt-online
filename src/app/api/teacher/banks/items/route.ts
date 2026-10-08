import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureQuestionBankSchema } from '@/lib/ensure-bank';
import crypto from 'node:crypto';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    await ensureQuestionBankSchema();

    const bankId = new URL(req.url).searchParams.get('bank_id');
    if (!bankId) {
      return NextResponse.json({ error: 'bank_id wajib diisi' }, { status: 400 });
    }

    const items = (await db
      .prepare('SELECT * FROM question_bank_items WHERE bank_id = ? ORDER BY order_index ASC')
      .all(bankId)) as unknown as any[];

    const result = await Promise.all(
      items.map(async (item) => {
        const options = (await db
          .prepare(
            'SELECT * FROM question_bank_item_options WHERE item_id = ? ORDER BY option_key ASC'
          )
          .all(item.id)) as unknown[];
        return { ...item, options };
      })
    );

    return NextResponse.json({ items: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    await ensureQuestionBankSchema();

    const body = await req.json();
    const {
      id,
      bank_id,
      question_text,
      image_url,
      points,
      explanation,
      options,
    } = body;

    if (!bank_id || !String(question_text || '').trim()) {
      return NextResponse.json({ error: 'bank_id dan narasi soal wajib diisi' }, { status: 400 });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Minimal 2 pilihan jawaban wajib diisi' }, { status: 400 });
    }
    if (!options.some((o: any) => o.is_correct === 1 || o.is_correct === true)) {
      return NextResponse.json({ error: 'Wajib memilih minimal satu kunci jawaban' }, { status: 400 });
    }

    let itemId = id;

    if (itemId) {
      const existing = (await db
        .prepare('SELECT id FROM question_bank_items WHERE id = ?')
        .get(itemId)) as unknown as { id: string } | null;
      if (!existing) {
        return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 });
      }
      await db.prepare(
        'UPDATE question_bank_items SET question_text = ?, image_url = ?, points = ?, explanation = ? WHERE id = ?'
      ).run(question_text, image_url || null, Number(points) || 10, explanation || null, itemId);
      await db.prepare('DELETE FROM question_bank_item_options WHERE item_id = ?').run(itemId);
    } else {
      itemId = `bankitem_${crypto.randomUUID().slice(0, 8)}`;
      const maxOrder = (await db
        .prepare('SELECT COALESCE(MAX(order_index), 0) AS max_order FROM question_bank_items WHERE bank_id = ?')
        .get(bank_id)) as unknown as { max_order: number };

      await db.prepare(
        `INSERT INTO question_bank_items (id, bank_id, order_index, question_text, image_url, points, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        itemId,
        bank_id,
        (maxOrder?.max_order || 0) + 1,
        question_text,
        image_url || null,
        Number(points) || 10,
        explanation || null
      );
    }

    for (const opt of options) {
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

    return NextResponse.json({ success: true, id: itemId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID soal wajib diisi' }, { status: 400 });
    }
    await db.prepare('DELETE FROM question_bank_item_options WHERE item_id = ?').run(id);
    await db.prepare('DELETE FROM question_bank_items WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
