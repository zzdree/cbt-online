'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export type QuestionStatus = 'answered' | 'hesitant' | 'empty';

interface QuestionNavigationGridProps {
  total: number;
  currentIndex: number;
  statuses: QuestionStatus[];
  onSelect: (index: number) => void;
}

export function QuestionNavigationGrid({
  total,
  currentIndex,
  statuses,
  onSelect,
}: QuestionNavigationGridProps) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const status = statuses[i] || 'empty';
        const isCurrent = i === currentIndex;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              'h-9 rounded-md text-xs font-semibold border transition-all tabular-nums',
              isCurrent && 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-slate-900 scale-105',
              status === 'answered' &&
                'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700',
              status === 'hesitant' &&
                'bg-amber-500 border-amber-500 text-white hover:bg-amber-600',
              status === 'empty' &&
                'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-brand-400'
            )}
            aria-label={`Soal nomor ${i + 1}, status ${
              status === 'answered' ? 'sudah dijawab' : status === 'hesitant' ? 'ragu-ragu' : 'belum dijawab'
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export function NavigationLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-emerald-600" /> Sudah dijawab
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-amber-500" /> Ragu-ragu
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />{' '}
        Belum dijawab
      </span>
    </div>
  );
}
