import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/teacher/monitor?exam_id=xxx
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('exam_id');

    if (!examId) {
      return NextResponse.json({ error: 'exam_id wajib diisi' }, { status: 400 });
    }

    const attempts = db
      .prepare('SELECT * FROM exam_attempts WHERE exam_id = ? ORDER BY start_time DESC')
      .all(examId) as any[];

    const nowMs = Date.now();

    const results = attempts.map((a) => {
      // Compute status: locked if lockout_until in future
      let status = a.status;
      let lockout_remaining = 0;
      if (a.lockout_until) {
        const lockUntilMs = new Date(a.lockout_until.replace(' ', 'T')).getTime();
        lockout_remaining = Math.max(0, Math.ceil((lockUntilMs - nowMs) / 1000));
        if (lockout_remaining > 0 && a.status !== 'submitted') {
          status = 'locked';
        }
      }

      // Answer progress
      const answered = db
        .prepare('SELECT COUNT(*) as c FROM attempt_answers WHERE attempt_id = ? AND selected_option_id IS NOT NULL')
        .get(a.id) as { c: number };
      const totalQuestions = db
        .prepare('SELECT COUNT(*) as c FROM questions WHERE exam_id = ?')
        .get(examId) as { c: number };

      const violations = db
        .prepare('SELECT * FROM violation_logs WHERE attempt_id = ? ORDER BY occurred_at DESC')
        .all(a.id) as any[];

      return {
        id: a.id,
        student_number: a.student_number,
        student_name: a.student_name,
        status,
        lockout_remaining,
        violation_count: a.violation_count,
        score: a.score,
        is_passed: a.is_passed,
        start_time: a.start_time,
        submit_time: a.submit_time,
        answered_count: answered.c,
        total_questions: totalQuestions.c,
        violations: violations.slice(0, 10),
      };
    });

    return NextResponse.json({ attempts: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
