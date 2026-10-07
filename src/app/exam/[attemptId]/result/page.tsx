'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RichContent } from '@/components/shared/RichContent';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  ArrowLeft,
  Award,
  Sparkles,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ExamResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Try sessionStorage first
    try {
      const cached = sessionStorage.getItem('cbt_result');
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
        if (parsed.show_score && parsed.is_passed) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
        return;
      }
    } catch {}

    // 2. Fetch from server
    fetch(`/api/student/state?attempt_id=${attemptId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.success) throw new Error(resData.error || 'Gagal memuat hasil');
        setData(resData);
        if (resData.show_score && resData.is_passed) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Memuat hasil ujian...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-sm text-rose-500 mb-4">{error || 'Hasil tidak ditemukan'}</p>
        <Link href="/">
          <Button variant="outline">Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  const showScore = !!data.show_score;
  const isPassed = !!data.is_passed;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Status Card */}
        <Card className="text-center p-6 sm:p-8">
          {showScore ? (
            /* CASE 1: SCORE VISIBLE */
            <>
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                  isPassed
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                <Award className="w-8 h-8" />
              </div>

              <Badge variant={isPassed ? 'emerald' : 'amber'} className="mb-2">
                {isPassed ? 'LULUS (MEMENUHI KKM)' : 'BELUM MEMENUHI KKM'}
              </Badge>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Ujian Selesai
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {data.exam_title || data.exam?.title} · {data.student_name}
              </p>

              {/* Big Score Display */}
              <div className="my-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Nilai Akhir Anda
                </span>
                <div className="text-6xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  {data.score}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Passing Grade (KKM): {data.passing_grade || data.exam?.passing_grade || 75}
                </div>
              </div>

              {/* Stats breakdown */}
              {data.stats && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                    <div className="text-lg font-bold text-emerald-600">{data.stats.correct}</div>
                    <span className="text-emerald-700 dark:text-emerald-400">Benar</span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                    <div className="text-lg font-bold text-rose-600">{data.stats.wrong}</div>
                    <span className="text-rose-700 dark:text-rose-400">Salah</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {data.stats.empty}
                    </div>
                    <span className="text-slate-500">Kosong</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* CASE 2: SCORE HIDDEN BY TEACHER */
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>

              <Badge variant="brand" className="mb-2">
                JAWABAN TERSIMPAN AMAN
              </Badge>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Ujian Berhasil Dikumpulkan
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {data.exam_title || data.exam?.title} · {data.student_name}
              </p>

              <div className="my-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 text-left space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  Jawaban Anda telah tercatat di server
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                  Pengawas mengonfigurasi ujian ini agar <strong>nilai tidak langsung dimunculkan</strong>.
                  Hasil evaluasi dan nilai akhir akan diumumkan oleh guru/sekolah setelah periode ujian berakhir.
                </p>
                {data.stats && (
                  <p className="text-xs text-slate-500 pl-7">
                    Anda telah menjawab {data.stats.total - data.stats.empty} dari {data.stats.total} butir soal.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Violations note if any */}
          {data.violation_count > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>
                Catatan integritas: Terdeteksi <strong>{data.violation_count}×</strong> meninggalkan
                halaman ujian.
              </span>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Link href="/">
              <Button variant="outline" size="md">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Utama
              </Button>
            </Link>
          </div>
        </Card>

        {/* Review Section (if allowed by teacher) */}
        {showScore && data.show_review && Array.isArray(data.review) && data.review.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" /> Pembahasan Soal
            </h2>

            {data.review.map((item: any, idx: number) => (
              <Card key={item.question_id} className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Soal Nomor {idx + 1}</span>
                  <Badge variant={item.is_correct ? 'emerald' : 'rose'}>
                    {item.is_correct ? 'Benar (+10)' : 'Salah (0)'}
                  </Badge>
                </div>

                <RichContent content={item.question_text} />

                {/* Options display with correct indicator */}
                <div className="space-y-1.5 pt-2">
                  {item.options.map((opt: any) => {
                    const isSelected = opt.id === item.selected_option_id;
                    const isCorrect = opt.option_key === item.correct_key;

                    return (
                      <div
                        key={opt.id}
                        className={`text-xs p-2.5 rounded-lg border flex items-start gap-2.5 ${
                          isCorrect
                            ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                            : isSelected
                              ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/30'
                              : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="font-bold w-5">{opt.option_key}.</span>
                        <div className="flex-1">
                          <RichContent content={opt.option_text} imageUrl={opt.image_url} />
                        </div>
                        {isCorrect && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Kunci
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Pilihan Anda
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {item.explanation && (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs">
                    <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-1">
                      Pembahasan:
                    </span>
                    <RichContent content={item.explanation} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
