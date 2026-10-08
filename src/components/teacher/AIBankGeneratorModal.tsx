'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RichContent } from '@/components/shared/RichContent';
import { DraftQuestion } from '@/types';
import { Cpu, RefreshCw, CheckCircle2, Circle, Loader2, AlertTriangle } from 'lucide-react';

interface AIBankGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  subject: string;
  onSaved: () => void;
}

const DIFFICULTIES = ['Mudah', 'Sedang', 'Sulit', 'HOTS'] as const;
const GRADE_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'Perguruan Tinggi'] as const;

export function AIBankGeneratorModal({
  isOpen,
  onClose,
  bankId,
  subject,
  onSaved,
}: AIBankGeneratorModalProps) {
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);

  const [form, setForm] = useState({
    topic: '',
    difficulty: 'Sedang' as (typeof DIFFICULTIES)[number],
    gradeLevel: 'SMA/SMK' as (typeof GRADE_LEVELS)[number],
    count: 5,
    stimulusText: '',
    includeMath: true,
    includeTable: false,
  });

  const reset = () => {
    setStep('form');
    setDrafts([]);
    setError('');
  };

  const generate = async () => {
    if (!form.topic.trim()) {
      setError('Topik materi wajib diisi');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/bank-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic: form.topic,
          difficulty: form.difficulty,
          gradeLevel: form.gradeLevel,
          count: form.count,
          stimulusText: form.stimulusText || undefined,
          includeMath: form.includeMath,
          includeTable: form.includeTable,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghasilkan soal');

      setDrafts(data.questions || []);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server AI gagal');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (tempId: string) => {
    setDrafts((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, selected: !d.selected } : d)));
  };

  const selectAll = (val: boolean) => {
    setDrafts((prev) => prev.map((d) => ({ ...d, selected: val })));
  };

  const saveToBank = async () => {
    const selected = drafts.filter((d) => d.selected);
    if (selected.length === 0) {
      setError('Pilih minimal satu soal untuk disimpan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/banks/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_id: bankId,
          questions: selected.map((d) => ({
            question_text: d.question_text,
            points: d.points,
            explanation: d.explanation,
            options: d.options.map((o) => ({
              key: o.key,
              text: o.text,
              is_correct: o.is_correct ? 1 : 0,
            })),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan soal ke bank');

      onSaved();
      onClose();
      reset();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan soal ke bank');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = drafts.filter((d) => d.selected).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        reset();
      }}
      title={
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Buat Butir Soal dengan AI</span>
          <Badge variant="brand">KiosAPI</Badge>
        </div>
      }
      description={
        step === 'form'
          ? 'AI menyusun butir soal. Anda tetap meninjau setiap soal sebelum disimpan.'
          : 'Tinjau hasil, koreksi bila perlu, lalu simpan ke bank soal.'
      }
      size="2xl"
    >
      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'form' ? (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mata Pelajaran
            </label>
            <input
              type="text"
              value={subject}
              readOnly
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Topik / Materi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Contoh: Hukum Newton dan Dinamika Gerak"
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tingkat Kesulitan
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: d })}
                    className={`text-xs py-2 rounded-md border font-medium transition-colors ${
                      form.difficulty === d
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenjang
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {GRADE_LEVELS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gradeLevel: g })}
                    className={`text-xs py-2 rounded-md border font-medium transition-colors ${
                      form.gradeLevel === g
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Jumlah Soal: <strong className="text-brand-600">{form.count}</strong> butir
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={form.count}
              onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-sm">
              <input
                type="checkbox"
                checked={form.includeMath}
                onChange={(e) => setForm({ ...form, includeMath: e.target.checked })}
                className="accent-brand-600 w-4 h-4"
              />
              <span>
                Rumus Matematika
                <span className="block text-[11px] text-slate-500 font-normal">Denota KaTeX</span>
              </span>
            </label>
            <label className="flex items-center gap-2.5 p-3 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-sm">
              <input
                type="checkbox"
                checked={form.includeTable}
                onChange={(e) => setForm({ ...form, includeTable: e.target.checked })}
                className="accent-brand-600 w-4 h-4"
              />
              <span>
                Tabel Data
                <span className="block text-[11px] text-slate-500 font-normal">Jika sesuai topik</span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ringkasan Materi (opsional)
            </label>
            <textarea
              rows={4}
              value={form.stimulusText}
              onChange={(e) => setForm({ ...form, stimulusText: e.target.value })}
              placeholder="Tempel ringkasan materi agar soal lebih sesuai dengan yang diajarkan."
              className="w-full text-sm p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="primary"
              size="lg"
              onClick={generate}
              isLoading={loading}
              disabled={loading || !form.topic.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" /> Buat {form.count} Butir Soal
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 rounded-lg">
            <div className="text-xs text-brand-800 dark:text-brand-300">
              AI menyusun <strong>{drafts.length} butir</strong>. Pilih yang akan disimpan:
              <strong> {selectedCount} dipilih</strong>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => selectAll(true)}>
                Pilih Semua
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectAll(false)}>
                Kosongkan
              </Button>
            </div>
          </div>

          {drafts.map((draft, idx) => (
            <div
              key={draft.tempId}
              className={`rounded-xl border p-4 transition-all ${
                draft.selected
                  ? 'border-brand-400 bg-white dark:bg-slate-900 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 opacity-70'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSelect(draft.tempId)}
                className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 mb-2.5"
              >
                {draft.selected ? (
                  <CheckCircle2 className="w-5 h-5 text-brand-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400" />
                )}
                Butir {idx + 1} · {draft.points} poin
              </button>

              <div className="text-sm mb-3">
                <RichContent content={draft.question_text} />
              </div>

              <div className="space-y-1.5">
                {draft.options.map((opt) => (
                  <div
                    key={opt.key}
                    className={`flex items-start gap-2 text-xs p-2 rounded-md border ${
                      opt.is_correct
                        ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        opt.is_correct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="flex-1 pt-0.5">
                      <RichContent content={opt.text} />
                    </span>
                  </div>
                ))}
              </div>

              {draft.explanation && (
                <div className="mt-2.5 text-xs p-2.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-md">
                  <span className="font-semibold text-amber-800 dark:text-amber-400">Pembahasan: </span>
                  <RichContent content={draft.explanation} />
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <Button variant="ghost" onClick={() => setStep('form')}>
              Ubah Parameter
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generate} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Buat Ulang
              </Button>
              <Button
                variant="success"
                onClick={saveToBank}
                isLoading={loading}
                disabled={loading || selectedCount === 0}
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan {selectedCount} Butir
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
