import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

const LOCKOUT_SECONDS = 30;

function formatDbTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const { attempt_id, violation_type } = await req.json();

    if (!attempt_id) {
      return NextResponse.json({ error: 'attempt_id wajib diisi' }, { status: 400 });
    }

    const attempt = (await db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(attempt_id)) as any;

    if (!attempt) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
    }

    if (attempt.status === 'submitted') {
      return NextResponse.json({ error: 'Ujian sudah selesai' }, { status: 400 });
    }

    const now = new Date();

    let lockoutUntil: Date;
    const isAlreadyLocked =
      attempt.lockout_until &&
      new Date(attempt.lockout_until.replace(' ', 'T')).getTime() > now.getTime();

    if (isAlreadyLocked) {
      lockoutUntil = new Date(attempt.lockout_until!.replace(' ', 'T'));
    } else {
      lockoutUntil = new Date(now.getTime() + LOCKOUT_SECONDS * 1000);

      await db.prepare(
        `UPDATE exam_attempts
         SET lockout_until = ?, violation_count = violation_count + 1, status = 'locked'
         WHERE id = ?`
      ).run(formatDbTime(lockoutUntil), attempt_id);

      await db.prepare(
        'INSERT INTO violation_logs (id, attempt_id, violation_type, duration_seconds) VALUES (?, ?, ?, ?)'
      ).run(
        `vlog_${crypto.randomUUID().slice(0, 8)}`,
        attempt_id,
        violation_type || 'tab_switch',
        LOCKOUT_SECONDS
      );
    }

    const remaining = Math.max(0, Math.ceil((lockoutUntil.getTime() - now.getTime()) / 1000));
    const freshAttempt = (await db
      .prepare('SELECT violation_count FROM exam_attempts WHERE id = ?')
      .get(attempt_id)) as any;

    return NextResponse.json({
      status: 'locked',
      lockout_until: formatDbTime(lockoutUntil),
      remaining_seconds: remaining,
      violation_count: freshAttempt?.violation_count || 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
