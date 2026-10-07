import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attempt_id');

    if (!attemptId) {
      return NextResponse.json({ error: 'attempt_id wajib diisi' }, { status: 400 });
    }

    const attempt = (await db
      .prepare('SELECT * FROM exam_attempts WHERE id = ?')
      .get(attemptId)) as any;

    if (!attempt) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
    }

    const exam = (await db.prepare('SELECT * FROM exams WHERE id = ?').get(attempt.exam_id)) as any;

    if (attempt.status === 'submitted') {
      return NextResponse.json({
        success: true,
        submitted: true,
        attempt_id: attempt.id,
        exam: {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          passing_grade: exam.passing_grade,
          show_score_immediately: exam.show_score_immediately,
          show_review_immediately: exam.show_review_immediately,
        },
        score: exam.show_score_immediately ? attempt.score : null,
        is_passed: exam.show_score_immediately ? attempt.is_passed : null,
        student_name: attempt.student_name,
        submit_time: attempt.submit_time,
        violation_count: attempt.violation_count,
      });
    }

    const startTime = new Date(attempt.start_time.replace(' ', 'T')).getTime();
    const durationMs = exam.duration_minutes * 60 * 1000;
    const endTimestamp = startTime + durationMs;
    const nowMs = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((endTimestamp - nowMs) / 1000));

    let lockoutRemaining = 0;
    if (attempt.lockout_until) {
      const lockoutUntilMs = new Date(attempt.lockout_until.replace(' ', 'T')).getTime();
      lockoutRemaining = Math.max(0, Math.ceil((lockoutUntilMs - nowMs) / 1000));
      if (lockoutRemaining === 0) {
        await db.prepare(
          "UPDATE exam_attempts SET lockout_until = NULL, status = 'in_progress' WHERE id = ?"
        ).run(attemptId);
      } else {
        await db.prepare("UPDATE exam_attempts SET status = 'locked' WHERE id = ?").run(attemptId);
      }
    }

    const questions = (await db
      .prepare(
        'SELECT id, order_index, question_text, image_url, points FROM questions WHERE exam_id = ? ORDER BY order_index ASC'
      )
      .all(attempt.exam_id)) as any[];

    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const options = (await db
          .prepare(
            'SELECT id, option_key, option_text, image_url FROM question_options WHERE question_id = ? ORDER BY option_key ASC'
          )
          .all(q.id)) as any[];
        return { ...q, options };
      })
    );

    const answers = (await db
      .prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?')
      .all(attemptId)) as any[];

    const answersMap: Record<string, { selected_option_id: string | null; is_hesitant: number }> = {};
    for (const a of answers) {
      answersMap[a.question_id] = {
        selected_option_id: a.selected_option_id,
        is_hesitant: a.is_hesitant,
      };
    }

    return NextResponse.json({
      success: true,
      submitted: false,
      attempt_id: attempt.id,
      student_name: attempt.student_name,
      violation_count: attempt.violation_count,
      lockout_remaining: lockoutRemaining,
      remaining_seconds: remainingSeconds,
      server_time: nowMs,
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        passing_grade: exam.passing_grade,
        randomize_options: exam.randomize_options,
        show_score_immediately: exam.show_score_immediately,
        show_review_immediately: exam.show_review_immediately,
      },
      questions: questionsWithOptions,
      answers: answersMap,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
