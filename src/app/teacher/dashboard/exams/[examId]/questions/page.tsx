'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RichContent } from '@/components/shared/RichContent';
import { QuestionEditorModal } from '@/components/teacher/QuestionEditorModal';
import { AIQuestionGeneratorModal } from '@/components/teacher/AIQuestionGeneratorModal';
import { BankQuestionPickerModal } from '@/components/teacher/BankQuestionPickerModal';
import { Question } from '@/types';
import {
  ArrowLeft,
  Plus,
  Library,
  Cpu,
  ListChecks,
  Edit,
  Trash2,
  CheckCircle2,
  Copy,
  Activity,
  FileQuestion,
  AlertCircle,
} from 'lucide-react';

export default function ExamQuestionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);

  const fetchData = async () => {
    setError('');
    setLoading(true);
    try {
      const [examRes, questionsRes] = await Promise.all([
        fetch('/api/teacher/exams'),
        fetch(`/api/teacher/questions?exam_id=${examId}`),
      ]);

      const examsData = await examRes.json();
      const currentExam = (examsData.exams || []).find((e: any) => e.id === examId);
      setExam(currentExam);

      const qData = await questionsRes.json();
      setQuestions(qData.questions || []);
    } catch (err: any) {
      setError('Gagal memuat bank soal. Periksa koneksi jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  const handleDelete = async (id: string, idx: number) => {
    if (!confirm(`Hapus soal nomor ${idx + 1}?`)) return;
    const res = await fetch(`/api/teacher/questions?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleEdit = (q: Question) => {
    setSelectedQuestion(q);
    setEditorOpen(true);
  };

  const handleCreateManual = () => {
    setSelectedQuestion(null);
    setEditorOpen(true);
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 10), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>

          <Button href={`/teacher/dashboard/exams/${examId}/monitor`} variant="primary" size="sm">
            <Activity className="w-4 h-4" /> Pantau Siswa Ujian
          </Button>
        </div>

        {/* Exam Title & Stats Banner */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="brand">{exam?.subject || 'Mata Pelajaran'}</Badge>
                <Badge variant="slate">Token: {exam?.token || '---'}</Badge>
                <Badge variant={exam?.show_score_immediately ? 'emerald' : 'slate'}>
                  {exam?.show_score_immediately ? 'Nilai Langsung Muncul' : 'Nilai Sembunyi'}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {exam?.title || 'Memuat ujian...'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Total: <strong>{questions.length} Butir Soal</strong> · Total Skor:{' '}
                <strong>{totalPoints} Poin</strong> · Durasi:{' '}
                <strong>{exam?.duration_minutes || 60} Menit</strong>
              </p>
            </div>

            {/* Bank soal adalah jalur utama; AI menjadi alternatif bila bank belum memuat cukup soal */}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="md" onClick={handleCreateManual}>
                <Plus className="w-4 h-4" /> Tulis Manual
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setBankPickerOpen(true)}
              >
                <Library className="w-4 h-4" /> Ambil dari Bank Soal
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setAiModalOpen(true)}
              >
                <Cpu className="w-4 h-4" /> Alternatif: Buat dengan AI
              </Button>
            </div>
          </div>
        </Card>

        {/* Questions List */}
        {error ? (
          <Card className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-base font-semibold text-rose-700 dark:text-rose-300">
              Gagal Memuat Bank Soal
            </h3>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-1 mb-5">
              Gagal memuat bank soal. Periksa koneksi jaringan Anda.
            </p>
            <Button variant="outline" onClick={() => fetchData()}>
              Coba Lagi
            </Button>
          </Card>
        ) : loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Memuat bank soal...</div>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center">
            <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Belum Ada Soal di Ujian Ini
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 mb-5 max-w-md mx-auto leading-relaxed">
              Cara terbaik: susun soal sekali di <strong>Bank Soal</strong>, lalu ambil dari sana
              untuk setiap ujian. Dengan begitu soal yang sama tidak perlu ditulis ulang.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={() => setBankPickerOpen(true)}>
                <Library className="w-4 h-4" /> Ambil dari Bank Soal
              </Button>
              <Button variant="outline" onClick={() => router.push('/teacher/dashboard/banks')}>
                <Plus className="w-4 h-4" /> Buka Bank Soal
              </Button>
              <Button variant="outline" onClick={handleCreateManual}>
                <Plus className="w-4 h-4" /> Tulis Manual
              </Button>
              <Button variant="outline" onClick={() => setAiModalOpen(true)}>
                <Cpu className="w-4 h-4" /> Alternatif: Buat dengan AI
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              AI memakai kuota KiosAPI milik sekolah. Aktifkan hanya bila bank soal belum memuat cukup butir.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={q.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-500">{q.points} Poin</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(q)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                      title="Edit Soal"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id, idx)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div className="text-sm">
                  <RichContent content={q.question_text} imageUrl={q.image_url} />
                </div>

                {/* Options List */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`text-xs p-2.5 rounded-lg border flex items-start gap-2.5 ${
                          opt.is_correct === 1
                            ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            opt.is_correct === 1
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {opt.option_key}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <RichContent content={opt.option_text} imageUrl={opt.image_url} />
                        </div>
                        {opt.is_correct === 1 && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px] pt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Kunci
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Solution Explanation if any */}
                {q.explanation && (
                  <div className="mt-2 p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs">
                    <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-0.5">
                      Pembahasan:
                    </span>
                    <RichContent content={q.explanation} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Manual Question Editor Modal */}
      <QuestionEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        examId={examId}
        initialQuestion={selectedQuestion}
        onSaved={fetchData}
      />

      {/* AI Question Generator Modal */}
      <AIQuestionGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        examId={examId}
        subject={exam?.subject || ''}
        onImported={fetchData}
      />

      {/* Pemilih butir soal dari bank soal */}
      <BankQuestionPickerModal
        isOpen={bankPickerOpen}
        onClose={() => setBankPickerOpen(false)}
        examId={examId}
        onImported={fetchData}
      />
    </div>
  );
}
