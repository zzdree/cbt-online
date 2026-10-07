import React from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card transition-all',
        hoverable && 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
