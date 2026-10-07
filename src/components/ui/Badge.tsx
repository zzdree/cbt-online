import React from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline';
}

export function Badge({ className, variant = 'slate', children, ...props }: BadgeProps) {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    outline: 'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
