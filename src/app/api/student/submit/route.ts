import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/student/submit — grade answers, finalize attempt, return result per visibility setting
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

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(attempt.exam_id) as any;

    if (attempt.status === 'submitted') {
      // Idempotent: return existing result
      return NextResponse.json({
        success: true,
        already_submitted: true,
        show_score: !!exam.show_score_immediately,
        score: exam.show_score_immediately ? attempt.score : null,
        is_passed: exam.show_score_immediately ? attempt.is_passed : null,
        violation_count: attempt.violation_count,
      });
    }

    // Grade: fetch all questions with correct options
    const questions = db
      .prepare('SELECT * FROM questions WHERE exam_id = ?')
      .all(attempt.exam_id) as any[];

    const answers = db
      .prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?')
      .all(attempt_id) as any[];

    const answersMap: Record<string, any> = {};
    for (const a of answers) answersMap[a.question_id] = a;

    let totalPossible = 0;
    let totalEarned = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;

    const breakdown: any[] = [];

    for (const q of questions) {
      const points = q.points || 10;
      totalPossible += points;

      const correctOption = db
        .prepare('SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1')
        .get(q.id) as any;

      const studentAnswer = answersMap[q.id];
      const selectedId = studentAnswer?.selected_option_id || null;

      let isCorrect = false;
      if (!selectedId) {
        emptyCount += 1;
      } else if (correctOption && selectedId === correctOption.id) {
        isCorrect = true;
        correctCount += 1;
        totalEarned += points;
      } else {
        wrongCount += 1;
      }

      breakdown.push({
        question_id: q.id,
        selected_option_id: selectedId,
        is_correct: isCorrect,
        points_earned: isCorrect ? points : 0,
        points_possible: points,
      });
    }

    const maxScore = totalPossible || 1;
    const normalizedScore = Math.round((totalEarned / maxScore) * 100 * 10) / 10;
    const isPassed = normalizedScore >= (exam.passing_grade || 75) ? 1 : 0;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const submitTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    db.prepare(
      `UPDATE exam_attempts
       SET status = 'submitted', submit_time = ?, score = ?, is_passed = ?, lockout_until = NULL
       WHERE id = ?`
    ).run(submitTime, normalizedScore, isPassed, attempt_id);

    const showScore = !!exam.show_score_immediately;
    const showReview = !!exam.show_review_immediately;

    const response: any = {
      success: true,
      show_score: showScore,
      show_review: showReview,
      violation_count: attempt.violation_count,
      stats: {
        correct: correctCount,
        wrong: wrongCount,
        empty: emptyCount,
        total: questions.length,
      },
      submit_time: submitTime,
      student_name: attempt.student_name,
      exam_title: exam.title,
      passing_grade: exam.passing_grade,
    };

    if (showScore) {
      response.score = normalizedScore;
      response.is_passed = isPassed;
      if (showReview) {
        // Return review data with explanations
        const review = breakdown.map((b) => {
          const q = questions.find((qq) => qq.id === b.question_id)!;
          const options = db
            .prepare('SELECT id, option_key, option_text, image_url FROM question_options WHERE question_id = ? ORDER BY option_key ASC')
            .all(b.question_id);
          const correctOpt = db
            .prepare('SELECT option_key FROM question_options WHERE question_id = ? AND is_correct = 1')
            .get(b.question_id) as any;
          return {
            ...b,
            question_text: q.question_text,
            points: q.points,
            explanation: showReview ? q.explanation : null,
            options,
            correct_key: correctOpt?.option_key || null,
          };
        });
        response.review = review;
      }
    } else {
      // Score intentionally hidden from student
      response.score = null;
      response.is_passed = null;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
