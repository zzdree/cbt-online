import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const { token, student_number, student_name } = await req.json();

    if (!token || !student_number || !student_name) {
      return NextResponse.json(
        { error: 'Kode ujian, nomor peserta, dan nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    const exam = (await db
      .prepare('SELECT * FROM exams WHERE token = ? AND is_active = 1')
      .get(token.trim().toUpperCase())) as any;

    if (!exam) {
      return NextResponse.json(
        { error: 'Kode ujian tidak ditemukan atau ujian tidak aktif' },
        { status: 404 }
      );
    }

    const existingAttempt = (await db
      .prepare(
        "SELECT * FROM exam_attempts WHERE exam_id = ? AND student_number = ? AND status != 'submitted'"
      )
      .get(exam.id, student_number.trim())) as any;

    if (existingAttempt) {
      return NextResponse.json({
        success: true,
        resume: true,
        attempt_id: existingAttempt.id,
        exam: {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          duration_minutes: exam.duration_minutes,
          passing_grade: exam.passing_grade,
          show_score_immediately: exam.show_score_immediately,
        },
        lockout_until: existingAttempt.lockout_until,
        start_time: existingAttempt.start_time,
        student_name: existingAttempt.student_name,
      });
    }

    const attemptId = `att_${crypto.randomUUID().slice(0, 8)}`;

    await db.prepare(
      `INSERT INTO exam_attempts (id, exam_id, student_number, student_name, status)
       VALUES (?, ?, ?, ?, 'in_progress')`
    ).run(attemptId, exam.id, student_number.trim(), student_name.trim());

    return NextResponse.json({
      success: true,
      resume: false,
      attempt_id: attemptId,
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        duration_minutes: exam.duration_minutes,
        passing_grade: exam.passing_grade,
        show_score_immediately: exam.show_score_immediately,
      },
      lockout_until: null,
      start_time: new Date().toISOString(),
      student_name: student_name.trim(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
