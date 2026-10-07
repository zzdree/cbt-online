import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsWithKiosAPI, getKiosApiConfig } from '@/lib/kiosapi';
import { AIQuestionRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: AIQuestionRequest = await req.json();

    if (!body.subject || !body.topic) {
      return NextResponse.json({ error: 'Mata pelajaran dan topik materi wajib diisi' }, { status: 400 });
    }

    const config = await getKiosApiConfig();
    if (!config.apiKey) {
      return NextResponse.json(
        {
          error: 'API Key KiosAPI belum diatur. Silakan masukkan API Key di menu "Pengaturan" di dashboard guru.',
          needConfig: true,
        },
        { status: 400 }
      );
    }

    const drafts = await generateQuestionsWithKiosAPI(body);
    return NextResponse.json({ success: true, questions: drafts });
  } catch (error: any) {
    console.error('AI Generation Failed:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghasilkan soal dengan AI' },
      { status: 500 }
    );
  }
}
