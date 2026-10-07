import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const { attempt_id, question_id, selected_option_id, is_hesitant } = await req.json();

    if (!attempt_id || !question_id) {
      return NextResponse.json({ error: 'attempt_id dan question_id wajib diisi' }, { status: 400 });
    }

    const attempt = (await db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(attempt_id)) as any;
    if (!attempt) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
    }
    if (attempt.status === 'submitted') {
      return NextResponse.json({ error: 'Ujian sudah selesai' }, { status: 400 });
    }

    const existing = await db
      .prepare('SELECT id FROM attempt_answers WHERE attempt_id = ? AND question_id = ?')
      .get(attempt_id, question_id);

    if (existing) {
      await db.prepare(
        `UPDATE attempt_answers
         SET selected_option_id = ?, is_hesitant = ?, updated_at = datetime('now', 'localtime')
         WHERE attempt_id = ? AND question_id = ?`
      ).run(
        selected_option_id || null,
        is_hesitant ? 1 : 0,
        attempt_id,
        question_id
      );
    } else {
      await db.prepare(
        `INSERT INTO attempt_answers (id, attempt_id, question_id, selected_option_id, is_hesitant)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        `ans_${crypto.randomUUID().slice(0, 8)}`,
        attempt_id,
        question_id,
        selected_option_id || null,
        is_hesitant ? 1 : 0
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
