'use client';

import React from 'react';
import { Timer, ListChecks, LogOut, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ExamHeaderProps {
  title: string;
  subject: string;
  studentName: string;
  remainingSeconds: number;
  violationCount: number;
  answeredCount: number;
  totalQuestions: number;
  onOpenNavigator: () => void;
  onSubmit: () => void;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamHeader({
  title,
  subject,
  studentName,
  remainingSeconds,
  violationCount,
  answeredCount,
  totalQuestions,
  onOpenNavigator,
  onSubmit,
}: ExamHeaderProps) {
  const isUrgent = remainingSeconds <= 300; // < 5 minutes
  const isCritical = remainingSeconds <= 60; // < 1 minute

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-3">
        {/* Exam info (hide subject on small screens) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
            <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">·</span>
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 truncate">
              {subject}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="truncate max-w-[140px] sm:max-w-none">{studentName}</span>
            <span className="flex items-center gap-1">
              <ListChecks className="w-3 h-3" />
              {answeredCount}/{totalQuestions}
            </span>
            {violationCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <ShieldAlert className="w-3 h-3" /> {violationCount}×
              </span>
            )}
          </div>
        </div>

        {/* Timer */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm tabular-nums border',
            isCritical
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 animate-pulse'
              : isUrgent
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          )}
          aria-label={`Sisa waktu ${formatTime(remainingSeconds)}`}
        >
          <Timer className="w-4 h-4" />
          <span>{formatTime(remainingSeconds)}</span>
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={onOpenNavigator}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Buka daftar soal"
        >
          <ListChecks className="w-4 h-4" />
          <span className="hidden xs:inline">Soal</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Selesai &amp; Kumpulkan</span>
          <span className="sm:hidden">Kumpul</span>
        </button>
      </div>
    </header>
  );
}
