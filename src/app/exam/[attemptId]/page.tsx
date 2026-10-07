'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExamHeader } from '@/components/student/ExamHeader';
import { LockoutModal } from '@/components/student/LockoutModal';
import { SubmitConfirmModal } from '@/components/student/SubmitConfirmModal';
import { QuestionNavigationGrid, NavigationLegend, QuestionStatus } from '@/components/student/QuestionNavigationGrid';
import { RichContent } from '@/components/shared/RichContent';
import { Button } from '@/components/ui/Button';
import { Flag, ChevronLeft, ChevronRight, CheckCircle2, Loader2, PanelRightOpen, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface QuestionOption {
  id: string;
  option_key: 'A' | 'B' | 'C' | 'D' | 'E';
  option_text: string;
  image_url?: string | null;
}

interface Question {
  id: string;
  order_index: number;
  question_text: string;
  image_url?: string | null;
  points: number;
  options: QuestionOption[];
}

interface AnswerState {
  selected_option_id: string | null;
  is_hesitant: boolean;
}

type LoadState = 'loading' | 'ready' | 'submitted' | 'error';

export default function ExamRoomPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const router = useRouter();

  // Core state
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [examInfo, setExamInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [violationCount, setViolationCount] = useState(0);

  // Timer (server-synced: based on remaining_seconds at load + monotonic tick)
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const deadlineRef = useRef<number>(0);

  // Anti-cheat lockout
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Submit
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Navigator drawer (mobile)
  const [showNavigator, setShowNavigator] = useState(false);

  // Guards against duplicate lockout triggers
  const lockoutInFlightRef = useRef(false);
  const submittedRef = useRef(false);

  // ----- Load exam state from server (also restores lockout on refresh) -----
  const loadStateFromServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/state?attempt_id=${attemptId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat ujian');

      if (data.submitted) {
        setLoadState('submitted');
        // Redirect to result page
        router.replace(`/exam/${attemptId}/result`);
        return;
      }

      setExamInfo(data.exam);
      setStudentName(data.student_name);
      setViolationCount(data.violation_count || 0);

      // Restore lockout if active (ANTI-REFRESH PROTECTION)
      if (data.lockout_remaining > 0) {
        setLockoutRemaining(data.lockout_remaining);
        setIsLocked(true);
      } else {
        setIsLocked(false);
        setLockoutRemaining(0);
      }

      // Server-synced timer: deadline = now + remaining_seconds
      deadlineRef.current = Date.now() + (data.remaining_seconds || 0) * 1000;
      setRemainingSeconds(data.remaining_seconds || 0);

      setQuestions(data.questions || []);
      const loadedAnswers: Record<string, AnswerState> = {};
      for (const [qid, a] of Object.entries(data.answers || {})) {
        const ans = a as any;
        loadedAnswers[qid] = {
          selected_option_id: ans.selected_option_id,
          is_hesitant: !!ans.is_hesitant,
        };
      }
      setAnswers(loadedAnswers);
      setLoadState('ready');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat ujian');
      setLoadState('error');
    }
  }, [attemptId, router]);

  useEffect(() => {
    loadStateFromServer();
  }, [loadStateFromServer]);

  // ----- Countdown timer tick -----
  useEffect(() => {
    if (loadState !== 'ready') return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !submittedRef.current) {
        clearInterval(interval);
        // Auto-submit when time expires
        handleSubmit(true);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState]);

  // ----- Lockout countdown tick -----
  useEffect(() => {
    if (!isLocked || lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, lockoutRemaining > 0]);

  // ----- ANTI-CHEAT: trigger lockout on tab switch / window blur -----
  const triggerLockout = useCallback(
    async (violationType: string) => {
      // Prevent duplicates (blur + visibilitychange often fire together)
      if (lockoutInFlightRef.current) return;
      if (submittedRef.current) return;
      if (loadState !== 'ready') return;

      // If already showing lockout, ignore
      if (isLocked && lockoutRemaining > 0) return;

      lockoutInFlightRef.current = true;
      try {
        const res = await fetch('/api/student/lockout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempt_id: attemptId, violation_type: violationType }),
        });
        const data = await res.json();
        if (res.ok) {
          setLockoutRemaining(data.remaining_seconds || 30);
          setIsLocked(true);
          setViolationCount(data.violation_count || 0);
        }
      } catch {
        // Network failure: still lock locally to stay strict
        setLockoutRemaining(30);
        setIsLocked(true);
      } finally {
        lockoutInFlightRef.current = false;
      }
    },
    [attemptId, isLocked, lockoutRemaining, loadState]
  );

  // Attach listeners ONLY when exam active & not locked
  useEffect(() => {
    if (loadState !== 'ready' || isLocked) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        triggerLockout('tab_switch');
      }
    };
    const onBlur = () => {
      triggerLockout('window_blur');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [loadState, isLocked, triggerLockout]);

  // ----- Unlock after 30s -----
  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch('/api/student/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsLocked(false);
        setLockoutRemaining(0);
      } else if (data.remaining_seconds > 0) {
        // Not yet expired — keep waiting
        setLockoutRemaining(data.remaining_seconds);
      }
    } catch {
      // Retry next tick
    } finally {
      setUnlocking(false);
    }
  };

  // ----- Answers -----
  const currentQuestion = questions[currentIndex];

  const selectOption = async (questionId: string, optionId: string) => {
    const prev = answers[questionId];
    // Toggle off if clicking the same option
    const newSelected = prev?.selected_option_id === optionId ? null : optionId;

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: {
        selected_option_id: newSelected,
        is_hesitant: prev?.is_hesitant || false,
      },
    }));

    // Persist to server (fire-and-forget with local optimistic update)
    fetch('/api/student/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: newSelected,
        is_hesitant: prev?.is_hesitant || false,
      }),
    }).catch(() => {});
  };

  const toggleHesitant = async (questionId: string) => {
    const prev = answers[questionId];
    const newHesitant = !prev?.is_hesitant;

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: {
        selected_option_id: prev?.selected_option_id || null,
        is_hesitant: newHesitant,
      },
    }));

    fetch('/api/student/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: prev?.selected_option_id || null,
        is_hesitant: newHesitant,
      }),
    }).catch(() => {});
  };

  // ----- Navigation status map -----
  const statuses: QuestionStatus[] = useMemo(() => {
    return questions.map((q) => {
      const a = answers[q.id];
      if (!a?.selected_option_id) return 'empty';
      return a.is_hesitant ? 'hesitant' : 'answered';
    });
  }, [questions, answers]);

  const stats = useMemo(() => {
    let answered = 0;
    let hesitant = 0;
    let empty = 0;
    statuses.forEach((s) => {
      if (s === 'empty') empty += 1;
      else if (s === 'hesitant') {
        hesitant += 1;
        answered += 1;
      } else answered += 1;
    });
    return { answered, hesitant, empty, total: questions.length };
  }, [statuses, questions.length]);

  // ----- Submit -----
  const handleSubmit = async (isAuto = false) => {
    if (submittedRef.current) return;
    if (!isAuto && !showSubmitConfirm) {
      setShowSubmitConfirm(true);
      return;
    }

    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengumpulkan ujian');

      // Store result summary for result page
      sessionStorage.setItem('cbt_result', JSON.stringify(data));
      router.replace(`/exam/${attemptId}/result`);
    } catch (err: any) {
      submittedRef.current = false;
      setSubmitting(false);
      setShowSubmitConfirm(false);
      alert(err.message || 'Gagal mengumpulkan. Silakan coba lagi.');
    }
  };

  // ----- Loading / error states -----
  if (loadState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500">Menyiapkan ruang ujian...</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Gagal Memuat Ujian
          </h2>
          <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Ujian tidak memiliki soal.</p>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className={cn('min-h-screen flex flex-col', isLocked && 'overflow-hidden')}>
      {/* Lockout overlay */}
      {isLocked && (
        <LockoutModal
          remainingSeconds={lockoutRemaining}
          violationCount={violationCount}
          onUnlock={handleUnlock}
          unlocking={unlocking}
        />
      )}

      {/* Blur exam content while locked */}
      <div className={cn(isLocked && 'blur-lg pointer-events-none select-none')} aria-hidden={isLocked}>
        <ExamHeader
          title={examInfo?.title || 'Ujian'}
          subject={examInfo?.subject || ''}
          studentName={studentName}
          remainingSeconds={remainingSeconds}
          violationCount={violationCount}
          answeredCount={stats.answered}
          totalQuestions={stats.total}
          onOpenNavigator={() => setShowNavigator(true)}
          onSubmit={() => setShowSubmitConfirm(true)}
        />

        <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex gap-6">
          {/* Main question area */}
          <main className="flex-1 min-w-0">
            {/* Question card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-brand-600 text-white text-sm font-bold flex items-center justify-center">
                    {currentIndex + 1}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    dari {questions.length} soal · {currentQuestion.points} poin
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleHesitant(currentQuestion.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    currentAnswer?.is_hesitant
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600'
                  )}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {currentAnswer?.is_hesitant ? 'Ditandai Ragu' : 'Ragu-Ragu?'}
                </button>
              </div>

              {/* Question body */}
              <div className="mb-5 min-h-[80px]">
                <RichContent
                  content={currentQuestion.question_text}
                  imageUrl={currentQuestion.image_url}
                  className="text-[15px] sm:text-base"
                />
              </div>

              {/* Options */}
              <div className="space-y-2.5" role="radiogroup" aria-label="Pilihan jawaban">
                {currentQuestion.options.map((opt) => {
                  const isSelected = currentAnswer?.selected_option_id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => selectOption(currentQuestion.id, opt.id)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all min-h-[52px]',
                        isSelected
                          ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      <span
                        className={cn(
                          'w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors',
                          isSelected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {opt.option_key}
                      </span>
                      <span className="flex-1 pt-0.5 text-[15px] text-slate-800 dark:text-slate-200">
                        <RichContent content={opt.option_text} imageUrl={opt.image_url} />
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prev / Next navigation (mobile & desktop) */}
            <div className="flex items-center justify-between gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </Button>

              <span className="text-xs text-slate-400 tabular-nums">
                {currentIndex + 1} / {questions.length}
              </span>

              {!isLastQuestion ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                >
                  Berikutnya <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="button" variant="danger" size="lg" onClick={() => setShowSubmitConfirm(true)}>
                  Selesai
                </Button>
              )}
            </div>
          </main>

          {/* Right sidebar navigator (desktop only) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Navigasi Soal
              </h3>
              <div className="flex gap-3 text-[11px] text-slate-500 mb-3">
                <span>{stats.answered} dijawab</span>
                <span className="text-amber-600">{stats.hesitant} ragu</span>
                <span className="text-slate-400">{stats.empty} kosong</span>
              </div>

              <QuestionNavigationGrid
                total={questions.length}
                currentIndex={currentIndex}
                statuses={statuses}
                onSelect={(i) => setCurrentIndex(i)}
              />

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <NavigationLegend />
              </div>

              <Button
                type="button"
                variant="danger"
                size="md"
                className="w-full mt-4"
                onClick={() => setShowSubmitConfirm(true)}
              >
                Kumpulkan Ujian
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile navigator drawer */}
      {showNavigator && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowNavigator(false)}
          />
          <div className="absolute bottom-0 inset-x-0 max-h-[75vh] bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Daftar Soal</h3>
                <p className="text-xs text-slate-500">
                  {stats.answered} dijawab · {stats.hesitant} ragu · {stats.empty} kosong
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNavigator(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Tutup daftar soal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <QuestionNavigationGrid
              total={questions.length}
              currentIndex={currentIndex}
              statuses={statuses}
              onSelect={(i) => {
                setCurrentIndex(i);
                setShowNavigator(false);
              }}
            />

            <div className="mt-4">
              <NavigationLegend />
            </div>

            <Button
              type="button"
              variant="danger"
              size="lg"
              className="w-full mt-4"
              onClick={() => {
                setShowNavigator(false);
                setShowSubmitConfirm(true);
              }}
            >
              Kumpulkan Ujian
            </Button>
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      <SubmitConfirmModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => handleSubmit(false)}
        submitting={submitting}
        stats={stats}
      />
    </div>
  );
}
