import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/student/unlock — validate 30s lockout expired, then reopen exam
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { attempt_id } = await req.json();

    if (!attempt_id) {
      return NextResponse.json({ error: 'attempt_id wajib diisi' }, { status: 400 });
    }

    const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(attempt_id) as any;

    if (!attempt) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
    }

    const nowMs = Date.now();

    if (attempt.lockout_until) {
      const lockoutUntilMs = new Date(attempt.lockout_until.replace(' ', 'T')).getTime();
      if (nowMs < lockoutUntilMs) {
        // Still locked — reject unlock, return remaining seconds
        const remaining = Math.ceil((lockoutUntilMs - nowMs) / 1000);
        return NextResponse.json(
          {
            error: 'Masa penguncian belum berakhir',
            remaining_seconds: remaining,
          },
          { status: 403 }
        );
      }
    }

    // Penalty served — reopen
    db.prepare(
      "UPDATE exam_attempts SET lockout_until = NULL, status = 'in_progress' WHERE id = ?"
    ).run(attempt_id);

    return NextResponse.json({ success: true, status: 'in_progress' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
