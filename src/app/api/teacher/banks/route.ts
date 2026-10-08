import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureQuestionBankSchema } from '@/lib/ensure-bank';
import crypto from 'node:crypto';

const TEACHER_ID = 'user_admin_awal';

export async function GET() {
  try {
    const db = await getDb();
    await ensureQuestionBankSchema();

    const banks = (await db
      .prepare(
        `SELECT b.*, (SELECT COUNT(*) FROM question_bank_items i WHERE i.bank_id = b.id) as item_count
         FROM question_banks b ORDER BY b.created_at DESC`
      )
      .all()) as unknown[];

    return NextResponse.json({ banks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    await ensureQuestionBankSchema();

    const body = await req.json();
    const name = String(body.name || '').trim();
    const subject = String(body.subject || '').trim();

    if (!name || !subject) {
      return NextResponse.json({ error: 'Nama bank soal dan mata pelajaran wajib diisi' }, { status: 400 });
    }

    const id = `bank_${crypto.randomUUID().slice(0, 8)}`;
    await db.prepare(
      'INSERT INTO question_banks (id, teacher_id, name, subject, description) VALUES (?, ?, ?, ?, ?)'
    ).run(id, TEACHER_ID, name, subject, String(body.description || '').trim() || null);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await getDb();
    await ensureQuestionBankSchema();

    const { id, name, subject, description } = await req.json();
    if (!id || !name || !subject) {
      return NextResponse.json({ error: 'Data bank soal tidak lengkap' }, { status: 400 });
    }

    await db.prepare(
      'UPDATE question_banks SET name = ?, subject = ?, description = ? WHERE id = ?'
    ).run(name, subject, description || null, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID bank soal wajib diisi' }, { status: 400 });
    }

    await db.prepare('DELETE FROM question_banks WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
