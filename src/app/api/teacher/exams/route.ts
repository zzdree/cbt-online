import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars[crypto.randomInt(chars.length)];
  }
  return token;
}

export async function GET() {
  try {
    const db = getDb();
    const exams = db
      .prepare(
        `SELECT e.*, (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) as question_count
         FROM exams e ORDER BY e.created_at DESC`
      )
      .all();
    return NextResponse.json({ exams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const {
      title,
      subject,
      duration_minutes = 60,
      passing_grade = 75,
      show_score_immediately = 1,
      show_review_immediately = 0,
      randomize_questions = 0,
      randomize_options = 0,
    } = body;

    if (!title || !subject) {
      return NextResponse.json({ error: 'Judul dan mata pelajaran wajib diisi' }, { status: 400 });
    }

    const id = `exam_${crypto.randomUUID().slice(0, 8)}`;
    let token = body.token || generateToken();

    // Ensure token uniqueness
    const existing = db.prepare('SELECT id FROM exams WHERE token = ?').get(token);
    if (existing) token = generateToken();

    db.prepare(
      `INSERT INTO exams (id, teacher_id, title, subject, token, duration_minutes, passing_grade,
        show_score_immediately, show_review_immediately, randomize_questions, randomize_options, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(
      id,
      'user_guru_01',
      title,
      subject,
      token,
      Number(duration_minutes),
      Number(passing_grade),
      show_score_immediately ? 1 : 0,
      show_review_immediately ? 1 : 0,
      randomize_questions ? 1 : 0,
      randomize_options ? 1 : 0
    );

    return NextResponse.json({ success: true, id, token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID ujian wajib diisi' }, { status: 400 });
    }

    const allowedFields = [
      'title',
      'subject',
      'duration_minutes',
      'passing_grade',
      'show_score_immediately',
      'show_review_immediately',
      'randomize_questions',
      'randomize_options',
      'is_active',
    ];

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (field in updates) {
        setClauses.push(`${field} = ?`);
        let val = updates[field];
        if (typeof val === 'boolean') val = val ? 1 : 0;
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan yang diterapkan' }, { status: 400 });
    }

    values.push(id);
    db.prepare(`UPDATE exams SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ success: true });
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
      return NextResponse.json({ error: 'ID ujian wajib diisi' }, { status: 400 });
    }

    db.prepare('DELETE FROM exams WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
