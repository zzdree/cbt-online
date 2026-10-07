'use client';

import React from 'react';
import { ShieldAlert, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LockoutModalProps {
  remainingSeconds: number;
  violationCount: number;
  onUnlock: () => void;
  unlocking: boolean;
}

export function LockoutModal({ remainingSeconds, violationCount, onUnlock, unlocking }: LockoutModalProps) {
  const isExpired = remainingSeconds <= 0;
  const progress = Math.max(0, Math.min(100, ((30 - remainingSeconds) / 30) * 100));

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Ujian terkunci karena pelanggaran"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-900 shadow-2xl overflow-hidden">
        {/* Header band */}
        <div className="bg-rose-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">LAYAR TERKUNCI</h2>
            <p className="text-rose-100 text-xs">Pelanggaran terdeteksi — ujian dijeda</p>
          </div>
        </div>

        {/* Countdown body */}
        <div className="px-6 py-7 text-center">
          {!isExpired ? (
            <>
              {/* Circular-ish big countdown */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-[6px] border-rose-200 dark:border-rose-900/60 flex items-center justify-center relative overflow-hidden">
                  {/* Progress arc via conic background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(#e11d48 ${progress * 3.6}deg, transparent 0deg)`,
                      opacity: 0.15,
                    }}
                  />
                  <span className="relative text-5xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    {remainingSeconds}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mt-5 leading-relaxed">
                Anda terdeteksi <strong className="text-rose-600">meninggalkan layar ujian</strong>{' '}
                (pindah tab / membuka jendela lain).
                <br />
                Ujian dikunci selama <strong>30 detik</strong>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Timer terus berjalan meskipun halaman di-refresh. Soal tidak dapat dibaca selama masa
                penguncian.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-4">
                <Unlock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Masa penguncian selesai
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Anda dapat melanjutkan ujian. Harap tetap fokus pada layar ujian.
              </p>
            </>
          )}

          {/* Violation counter */}
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Total pelanggaran tercatat: <strong>{violationCount}×</strong>
          </div>

          {isExpired && (
            <div className="mt-6">
              <Button
                type="button"
                variant="success"
                size="lg"
                className="w-full"
                onClick={onUnlock}
                isLoading={unlocking}
              >
                <Unlock className="w-4 h-4" /> Saya Mengerti &amp; Lanjutkan Ujian
              </Button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Pelanggaran ini dicatat dan dilaporkan ke pengawas ujian.
          </p>
        </div>
      </div>
    </div>
  );
}
