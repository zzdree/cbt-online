'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EquationHelperModal } from './EquationHelperModal';
import { TableGeneratorModal } from './TableGeneratorModal';
import { RichContent } from '@/components/shared/RichContent';
import { Question, QuestionOption } from '@/types';
import { Calculator, Table, Image, Eye, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  initialQuestion?: Question | null;
  onSaved: () => void;
}

export function QuestionEditorModal({
  isOpen,
  onClose,
  examId,
  initialQuestion,
  onSaved,
}: QuestionEditorModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [points, setPoints] = useState(10);
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<
    { key: 'A' | 'B' | 'C' | 'D' | 'E'; text: string; image_url?: string; is_correct: boolean }[]
  >([
    { key: 'A', text: '', is_correct: true },
    { key: 'B', text: '', is_correct: false },
    { key: 'C', text: '', is_correct: false },
    { key: 'D', text: '', is_correct: false },
    { key: 'E', text: '', is_correct: false },
  ]);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isEquationHelperOpen, setIsEquationHelperOpen] = useState(false);
  const [isTableGeneratorOpen, setIsTableGeneratorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialQuestion) {
      setQuestionText(initialQuestion.question_text || '');
      setImageUrl(initialQuestion.image_url || '');
      setPoints(initialQuestion.points || 10);
      setExplanation(initialQuestion.explanation || '');

      if (initialQuestion.options && initialQuestion.options.length > 0) {
        setOptions(
          initialQuestion.options.map((opt) => ({
            key: opt.option_key,
            text: opt.option_text,
            image_url: opt.image_url || '',
            is_correct: opt.is_correct === 1,
          }))
        );
      }
    } else {
      // Reset defaults
      setQuestionText('');
      setImageUrl('');
      setPoints(10);
      setExplanation('');
      setOptions([
        { key: 'A', text: '', is_correct: true },
        { key: 'B', text: '', is_correct: false },
        { key: 'C', text: '', is_correct: false },
        { key: 'D', text: '', is_correct: false },
        { key: 'E', text: '', is_correct: false },
      ]);
    }
    setActiveTab('editor');
    setErrorMsg('');
  }, [initialQuestion, isOpen]);

  const handleInsertText = (snippet: string) => {
    setQuestionText((prev) => prev + (prev.endsWith('\n') || prev === '' ? '' : '\n') + snippet);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/teacher/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload gagal');

      if (target === 'question') {
        setImageUrl(data.url);
      } else {
        const updated = [...options];
        updated[target].image_url = data.url;
        setOptions(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const setCorrectOption = (index: number) => {
    setOptions(
      options.map((opt, i) => ({
        ...opt,
        is_correct: i === index,
      }))
    );
  };

  const updateOptionText = (index: number, text: string) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  const handleSave = async () => {
    if (!questionText.trim()) {
      setErrorMsg('Pertanyaan soal tidak boleh kosong');
      return;
    }

    const hasEmptyOption = options.some((opt) => !opt.text.trim() && !opt.image_url);
    if (hasEmptyOption) {
      setErrorMsg('Semua opsi pilihan jawaban (A-E) harus diisi teks atau gambar');
      return;
    }

    const hasCorrect = options.some((opt) => opt.is_correct);
    if (!hasCorrect) {
      setErrorMsg('Pilih minimal satu kunci jawaban yang benar');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        id: initialQuestion?.id,
        exam_id: examId,
        question_text: questionText,
        image_url: imageUrl || null,
        points: Number(points) || 10,
        explanation: explanation || null,
        options: options.map((opt) => ({
          option_key: opt.key,
          option_text: opt.text,
          image_url: opt.image_url || null,
          is_correct: opt.is_correct ? 1 : 0,
        })),
      };

      const res = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan soal');

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan soal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialQuestion ? 'Edit Soal Ujian' : 'Tambah Soal Manual'}
        description="Lengkapi narasi soal, rumus matematika, tabel, dan kunci jawaban pilihan ganda."
        size="2xl"
      >
        <div className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'editor'
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Editor Soal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 px-4 text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Eye className="w-4 h-4" /> Pratinjau Tampilan Siswa
            </button>
          </div>

          {activeTab === 'editor' ? (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Question Stem Toolbar & Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Narasi Pertanyaan Soal
                  </label>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEquationHelperOpen(true)}
                      title="Sisipkan Rumus Matematika KaTeX"
                    >
                      <Calculator className="w-3.5 h-3.5 text-brand-600" /> Rumus (KaTeX)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTableGeneratorOpen(true)}
                      title="Sisipkan Tabel Data"
                    >
                      <Table className="w-3.5 h-3.5 text-emerald-600" /> Tabel
                    </Button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ketik soal di sini. Gunakan $rumus$ untuk rumus inline dan $$rumus$$ untuk rumus tengah. Tabel Markdown juga didukung."
                  className="w-full text-sm p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Image Attachment for Question */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-slate-500" /> Lampirkan Gambar Soal (Opsional)
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Hapus Gambar
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL gambar (https://...) atau unggah berkas di samping"
                    className="flex-1 text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                  <label className="cursor-pointer">
                    <span className="text-xs inline-flex items-center gap-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 font-medium">
                      {isUploading ? 'Mengunggah...' : 'Pilih File'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'question')}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Pratinjau"
                      className="max-h-36 rounded border border-slate-200 object-contain bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Options Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilihan Jawaban (A - E) &amp; Kunci Jawaban
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Klik radio button untuk memilih kunci jawaban benar
                  </span>
                </div>

                {options.map((opt, idx) => (
                  <div
                    key={opt.key}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border transition-colors ${
                      opt.is_correct
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCorrectOption(idx)}
                      className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-colors ${
                        opt.is_correct
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:border-brand-500'
                      }`}
                      title={opt.is_correct ? 'Kunci Jawaban Benar' : 'Jadikan Kunci Jawaban'}
                    >
                      {opt.key}
                    </button>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOptionText(idx, e.target.value)}
                        placeholder={`Teks pilihan ${opt.key} (contoh: $x = 5$)`}
                        className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />

                      {/* Optional Option Image */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.image_url || ''}
                          onChange={(e) => {
                            const updated = [...options];
                            updated[idx].image_url = e.target.value;
                            setOptions(updated);
                          }}
                          placeholder="URL gambar opsi (opsional)"
                          className="flex-1 text-[11px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                        />
                        <label className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-800 underline">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, idx)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Points & Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bobot Poin
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pembahasan / Solusi (Muncul jika pembahasan diaktifkan)
                  </label>
                  <input
                    type="text"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Langkah penyelesaian (mendukung KaTeX $...$)"
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Live Student Preview Mode */
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span>Pratinjau Nomor 1</span>
                <span>Bobot: {points} Poin</span>
              </div>

              {/* Question Text */}
              <RichContent content={questionText || '*(Belum ada narasi soal)*'} imageUrl={imageUrl} />

              {/* Options List */}
              <div className="space-y-2 pt-2">
                {options.map((opt) => (
                  <div
                    key={opt.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border bg-white dark:bg-slate-900 ${
                      opt.is_correct
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        opt.is_correct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <div className="flex-1">
                      <RichContent content={opt.text || `*(Opsi ${opt.key})*`} imageUrl={opt.image_url} />
                    </div>
                    {opt.is_correct && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kunci
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {explanation && (
                <div className="mt-3 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs">
                  <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-1">
                    Pembahasan:
                  </span>
                  <RichContent content={explanation} />
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={isSaving}
            >
              {initialQuestion ? 'Simpan Perubahan' : 'Tambahkan Soal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Helper Modals */}
      <EquationHelperModal
        isOpen={isEquationHelperOpen}
        onClose={() => setIsEquationHelperOpen(false)}
        onInsert={handleInsertText}
      />
      <TableGeneratorModal
        isOpen={isTableGeneratorOpen}
        onClose={() => setIsTableGeneratorOpen(false)}
        onInsert={handleInsertText}
      />
    </>
  );
}
