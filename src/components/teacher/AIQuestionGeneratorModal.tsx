'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RichContent } from '@/components/shared/RichContent';
import { DraftQuestion, AIQuestionRequest } from '@/types';
import { Cpu, Play, RefreshCw, CheckCircle2, Circle, Loader2, AlertTriangle, Settings } from 'lucide-react';

interface AIQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  subject: string;
  onImported: () => void;
  onGoToSettings?: () => void;
}

const DIFFICULTIES = ['Mudah', 'Sedang', 'Sulit', 'HOTS'] as const;
const GRADE_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'Perguruan Tinggi'] as const;
const MODELS = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat (Cepat & Murah)' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (Akurat)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o (Kualitas Tertinggi)' },
];

export function AIQuestionGeneratorModal({
  isOpen,
  onClose,
  examId,
  subject,
  onImported,
  onGoToSettings,
}: AIQuestionGeneratorModalProps) {
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    topic: '',
    difficulty: 'Sedang' as (typeof DIFFICULTIES)[number],
    gradeLevel: 'SMA/SMK' as (typeof GRADE_LEVELS)[number],
    count: 5,
    model: 'deepseek-chat',
    stimulusText: '',
    includeMath: true,
    includeTable: false,
  });

  const resetForm = () => {
    setStep('form');
    setDrafts([]);
    setError('');
    setEditingId(null);
  };

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      setError('Topik materi wajib diisi');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload: AIQuestionRequest = {
        subject,
        topic: form.topic,
        difficulty: form.difficulty,
        gradeLevel: form.gradeLevel,
        count: form.count,
        stimulusText: form.stimulusText || undefined,
        includeMath: form.includeMath,
        includeTable: form.includeTable,
        model: form.model,
      };

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.needConfig && onGoToSettings) {
          setError(data.error + ' Klik "Buka Pengaturan" di kanan atas dashboard.');
        } else {
          setError(data.error || 'Gagal menghasilkan soal');
        }
        return;
      }

      if (!data.questions || data.questions.length === 0) {
        setError('AI tidak mengembalikan soal. Coba ubah parameter atau ulangi.');
        return;
      }

      setDrafts(data.questions);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server AI gagal');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (tempId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.tempId === tempId ? { ...d, selected: !d.selected } : d))
    );
  };

  const selectAll = (val: boolean) => {
    setDrafts((prev) => prev.map((d) => ({ ...d, selected: val })));
  };

  const handleImport = async () => {
    const selected = drafts.filter((d) => d.selected);
    if (selected.length === 0) {
      setError('Pilih minimal satu soal untuk diimpor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/questions/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId,
          questions: selected.map((d) => ({
            question_text: d.question_text,
            points: d.points,
            explanation: d.explanation,
            options: d.options.map((o) => ({
              option_key: o.key,
              option_text: o.text,
              is_correct: o.is_correct ? 1 : 0,
            })),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor soal');

      onImported();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Gagal mengimpor soal ke ujian');
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
        resetForm();
      }}
      title={
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Generator Soal Otomatis AI</span>
          <Badge variant="brand">KiosAPI</Badge>
        </div>
      }
      description={
        step === 'form'
          ? 'Buat butir soal berkualitas dalam hitungan detik menggunakan DeepSeek atau GPT.'
          : 'Tinjau, koreksi, lalu impor soal pilihan Anda ke bank soal ujian.'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Topic */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Topik / Materi Pokok <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="Contoh: Hukum Newton & Dinamika Gerak, Turunan Fungsi Aljabar"
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Difficulty */}
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
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenjang Pendidikan
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
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
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
              <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                <span>1</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Model AI (KiosAPI)
              </label>
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Include Math & Table */}
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-sm">
                <input
                  type="checkbox"
                  checked={form.includeMath}
                  onChange={(e) => setForm({ ...form, includeMath: e.target.checked })}
                  className="accent-brand-600 w-4 h-4"
                />
                <span>
                  Sertakan <strong>Rumus KaTeX</strong>
                  <span className="block text-[11px] text-slate-500 font-normal">Matematika, Fisika, Kimia</span>
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
                  Sertakan <strong>Tabel Data</strong>
                  <span className="block text-[11px] text-slate-500 font-normal">Jika relevan dengan topik</span>
                </span>
              </label>
            </div>

            {/* Stimulus Text */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ringkasan Materi / Bahan Ajar (Opsional)
              </label>
              <textarea
                rows={4}
                value={form.stimulusText}
                onChange={(e) => setForm({ ...form, stimulusText: e.target.value })}
                placeholder="Tempel ringkasan bab buku, artikel, atau poin-poin materi di sini agar AI membuat soal yang lebih relevan..."
                className="w-full text-sm p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              isLoading={loading}
              disabled={loading || !form.topic.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> AI Sedang Menyusun Soal...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Generate {form.count} Soal dengan AI
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Review & Staging Board */
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 rounded-lg">
            <div className="text-xs text-brand-800 dark:text-brand-300">
              AI menghasilkan <strong>{drafts.length} soal</strong>. Pilih soal yang akan diimpor:
              <strong> {selectedCount} dipilih</strong>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => selectAll(true)}>
                Pilih Semua
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => selectAll(false)}>
                Kosongkan
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {drafts.map((draft, idx) => (
              <div
                key={draft.tempId}
                className={`rounded-xl border p-4 transition-all ${
                  draft.selected
                    ? 'border-brand-400 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <button
                    type="button"
                    onClick={() => toggleSelect(draft.tempId)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600"
                  >
                    {draft.selected ? (
                      <CheckCircle2 className="w-5 h-5 text-brand-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                    Soal {idx + 1} · {draft.points} poin
                  </button>
                </div>

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
                      {opt.is_correct && <span className="text-emerald-600 font-semibold pt-0.5">✓</span>}
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
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <Button type="button" variant="ghost" size="md" onClick={() => setStep('form')}>
              ← Kembali ke Form
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Regenerasi
              </Button>
              <Button
                type="button"
                variant="success"
                size="md"
                onClick={handleImport}
                isLoading={loading}
                disabled={loading || selectedCount === 0}
              >
                <CheckCircle2 className="w-4 h-4" /> Impor {selectedCount} Soal Terpilih
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
