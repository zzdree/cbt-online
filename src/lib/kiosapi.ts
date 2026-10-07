import { getDb } from '@/lib/db';
import { AIQuestionRequest, DraftQuestion } from '@/types';

export async function getKiosApiConfig() {
  const db = getDb();
  const apiKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'kiosapi_key'").get() as { value: string } | undefined;
  const baseUrlRow = db.prepare("SELECT value FROM settings WHERE key = 'kiosapi_base_url'").get() as { value: string } | undefined;
  const modelRow = db.prepare("SELECT value FROM settings WHERE key = 'kiosapi_model'").get() as { value: string } | undefined;

  return {
    apiKey: apiKeyRow?.value || process.env.KIOSAPI_API_KEY || '',
    baseUrl: baseUrlRow?.value || process.env.KIOSAPI_BASE_URL || 'https://api.kiosapi.com/v1',
    model: modelRow?.value || process.env.KIOSAPI_MODEL || 'deepseek-chat',
  };
}

export async function generateQuestionsWithKiosAPI(req: AIQuestionRequest): Promise<DraftQuestion[]> {
  const config = await getKiosApiConfig();

  if (!config.apiKey) {
    throw new Error('API Key KiosAPI belum dikonfigurasi. Silakan atur di menu Pengaturan Guru.');
  }

  const modelToUse = req.model || config.model || 'deepseek-chat';

  const systemPrompt = `Anda adalah asisten ahli pembuat soal ujian akademik profesional (CBT) berstandar kurikulum nasional Indonesia (Kurikulum Merdeka dan UTBK).
Tugas Anda adalah membuat butir soal pilihan ganda (A, B, C, D, E) yang berkualitas tinggi, orisinal, akurat secara konsep, dan bebas dari ambiguitas.

KETENTUAN KHUSUS FORMAT:
1. Jika soal mengandung rumus matematika, fisika, atau kimia, WAJIB gunakan notasi LaTeX KaTeX:
   - Gunakan $...$ untuk rumus inline (misal: $x^2 + 5x = 0$, $E = mc^2$, $\\text{H}_2\\text{O}$).
   - Gunakan $$...$$ untuk rumus tengah / pecahan besar (misal: $$\\int_0^2 x^2 dx = \\frac{8}{3}$$).
2. Jika diminta menyertakan tabel data, buat tabel menggunakan format Markdown standar:
   | Kolom 1 | Kolom 2 |
   |---|---|
   | Data 1 | Data 2 |
3. Setiap soal WAJIB memiliki 5 pilihan jawaban lengkap (A, B, C, D, E) dengan tepat 1 kunci jawaban yang benar.
4. Sertakan penjelasan / pembahasan solusi yang rinci dan mudah dipahami.
5. WAJIB mengembalikan jawaban HANYA dalam format JSON valid tanpa tanda kutip markdown (\`\`\`json) atau teks pengantar apapun.`;

  const userPrompt = `Buatlah ${req.count} butir soal ujian pilihan ganda dengan spesifikasi berikut:
- Mata Pelajaran: ${req.subject}
- Topik / Materi Spesifik: ${req.topic}
- Jenjang Pendidikan: ${req.gradeLevel}
- Tingkat Kesulitan: ${req.difficulty}
- Sertakan Rumus Matematika (KaTeX): ${req.includeMath ? 'Ya, sertakan rumus jika relevan' : 'Hanya jika diperlukan'}
- Sertakan Tabel Data: ${req.includeTable ? 'Ya, buat tabel data jika relevan' : 'Tidak perlu'}
${req.stimulusText ? `\nTeks Referensi / Ringkasan Materi:\n"""\n${req.stimulusText}\n"""\n` : ''}

Format JSON yang WAJIB dihasilkan:
{
  "questions": [
    {
      "question_text": "Narasi pertanyaan lengkap (gunakan $...$ untuk rumus dan tabel markdown jika ada)",
      "points": 10,
      "explanation": "Langkah penyelesaian lengkap dengan KaTeX",
      "correct_key": "A",
      "options": [
        {"key": "A", "text": "Teks opsi A"},
        {"key": "B", "text": "Teks opsi B"},
        {"key": "C", "text": "Teks opsi C"},
        {"key": "D", "text": "Teks opsi D"},
        {"key": "E", "text": "Teks opsi E"}
      ]
    }
  ]
}`;

  // Call KiosAPI via OpenAI-compatible endpoint
  const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KiosAPI Error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const rawContent = json.choices?.[0]?.message?.content || '{}';

  // Parse JSON output safely
  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanJson);
  const questionsList = parsed.questions || parsed.data || [];

  return questionsList.map((q: any, idx: number) => {
    const correctKey = (q.correct_key || 'A').toUpperCase();
    return {
      tempId: `draft_${Date.now()}_${idx}`,
      question_text: q.question_text || '',
      points: q.points || 10,
      explanation: q.explanation || '',
      selected: true, // checked by default
      options: (q.options || []).map((opt: any) => ({
        key: opt.key?.toUpperCase(),
        text: opt.text || '',
        is_correct: opt.key?.toUpperCase() === correctKey,
      })),
    };
  });
}
