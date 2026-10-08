import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsWithKiosAPI } from '@/lib/kiosapi';

// Sama seperti /api/ai/generate, tetapi hasilnya untuk bank soal.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.subject || !body.topic) {
      return NextResponse.json({ error: 'Mata pelajaran dan topik materi wajib diisi' }, { status: 400 });
    }
    if (!body.count || Number(body.count) < 1) {
      return NextResponse.json({ error: 'Jumlah soal minimal 1' }, { status: 400 });
    }

    const drafts = await generateQuestionsWithKiosAPI({
      subject: String(body.subject),
      topic: String(body.topic),
      difficulty: body.difficulty || 'Sedang',
      gradeLevel: body.gradeLevel || 'SMA/SMK',
      count: Number(body.count),
      stimulusText: body.stimulusText,
      includeMath: body.includeMath !== false,
      includeTable: body.includeTable === true,
      model: body.model,
    });

    if (!drafts.length) {
      return NextResponse.json({ error: 'AI tidak mengembalikan soal. Coba ubah parameter.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, questions: drafts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghasilkan soal' }, { status: 500 });
  }
}
