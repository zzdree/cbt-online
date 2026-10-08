'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RichContent } from '@/components/shared/RichContent';
import { Library, Check, CheckCircle2, Loader2 } from 'lucide-react';

interface BankItem {
  id: string;
  question_text: string;
  points: number;
  options: {
    id: string;
    option_key: string;
    option_text: string;
    is_correct: number;
  }[];
}

interface Bank {
  id: string;
  name: string;
  subject: string;
  item_count: number;
}

interface BankQuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  onImported: () => void;
}

export function BankQuestionPickerModal({
  isOpen,
  onClose,
  examId,
  onImported,
}: BankQuestionPickerModalProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [activeBankId, setActiveBankId] = useState('');
  const [items, setItems] = useState<BankItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setError('');
      return;
    }

    const fetchBanks = async () => {
      setLoadingBanks(true);
      setError('');
      try {
        const res = await fetch('/api/teacher/banks');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'gagal memuat bank soal');
        const list = data.banks || [];
        setBanks(list);
        if (list.length > 0) {
          setActiveBankId(list[0].id);
        }
      } catch (err: any) {
        setError('Gagal memuat daftar bank soal.');
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, [isOpen]);

  useEffect(() => {
    if (!activeBankId) return;

    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await fetch(`/api/teacher/banks/items?bank_id=${activeBankId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'gagal');
        setItems(data.items || []);
        setSelectedIds([]);
      } catch {
        setError('Gagal memuat butir soal dari bank.');
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [activeBankId]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const copyToExam = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/exams/copy-from-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: examId, item_ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'gagal menyalin soal');

      onImported();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyalin soal ke ujian');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Ambil Soal dari Bank Soal</span>
        </div>
      }
      description="Pilih butir soal yang sudah pernah Anda susun. Soal akan disalin agar ujian tidak berubah walau bank diedit."
      size="2xl"
    >
      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {loadingBanks ? (
        <div className="py-12 flex flex-col items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Memuat bank soal...
        </div>
      ) : banks.length === 0 ? (
        <div className="py-12 text-center">
          <Library className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300">Belum ada bank soal.</p>
          <p className="text-xs text-slate-500 mt-1">
            Buat bank soal terlebih dahulu dari menu Bank Soal pada dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pemilih bank */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {banks.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => setActiveBankId(bank.id)}
                className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                  activeBankId === bank.id
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {bank.name}
                <span className="ml-1 opacity-70">({bank.item_count ?? 0})</span>
              </button>
            ))}
          </div>

          {loadingItems ? (
            <div className="py-12 flex flex-col items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat butir soal...
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Bank ini masih kosong. Tambahkan butir soal lebih dulu.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/25'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Butir {idx + 1} · {item.points} poin
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className="text-sm mb-2">
                      <RichContent content={item.question_text} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {item.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`text-[11px] p-1.5 rounded-md border flex items-center gap-1.5 ${
                            opt.is_correct === 1
                              ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <span className="font-bold text-slate-500">{opt.option_key}</span>
                          <span className="flex-1 truncate">
                            <RichContent content={opt.option_text} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">{selectedIds.length} butir dipilih</span>
              <Button
                variant="success"
                onClick={copyToExam}
                isLoading={saving}
                disabled={saving || selectedIds.length === 0}
              >
                <CheckCircle2 className="w-4 h-4" /> Salin {selectedIds.length} Butir ke Ujian
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
