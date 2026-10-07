'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Send } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  stats: {
    answered: number;
    hesitant: number;
    empty: number;
    total: number;
  };
}

export function SubmitConfirmModal({ isOpen, onClose, onConfirm, submitting, stats }: SubmitConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selesaikan Ujian?"
      description="Periksa kembali rekapitulasi sebelum mengumpulkan jawaban."
      size="md"
      showCloseButton={!submitting}
    >
      <div className="space-y-4">
        {/* Recap stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Soal</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.answered}</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-500">Dijawab</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.hesitant}</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-500">Ragu</div>
          </div>
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.empty}</div>
            <div className="text-[11px] text-rose-700 dark:text-rose-500">Kosong</div>
          </div>
        </div>

        {stats.empty > 0 && (
          <div className="flex gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Masih ada <strong>{stats.empty} soal</strong> yang belum dijawab. Soal kosong tidak
              mendapat poin.
            </p>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Setelah dikumpulkan, jawaban tidak dapat diubah lagi.
        </p>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onClose} disabled={submitting}>
            Kembali Periksa
          </Button>
          <Button type="button" variant="danger" size="lg" className="flex-1" onClick={onConfirm} isLoading={submitting}>
            <Send className="w-4 h-4" /> Kumpulkan Sekarang
          </Button>
        </div>
      </div>
    </Modal>
  );
}
