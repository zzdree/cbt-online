'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { renderMathOnly } from '@/lib/rich-parser';
import { Calculator, Check, Copy } from 'lucide-react';

interface EquationHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (snippet: string) => void;
}

interface FormulaPreset {
  category: string;
  items: {
    label: string;
    latex: string;
    display?: string;
  }[];
}

const PRESETS: FormulaPreset[] = [
  {
    category: 'Aljabar & Aritmatika',
    items: [
      { label: 'Pecahan', latex: '\\frac{a}{b}' },
      { label: 'Pangkat', latex: 'x^{2}' },
      { label: 'Subskrip (Indeks)', latex: 'x_{1}' },
      { label: 'Akar Kuadrat', latex: '\\sqrt{x}' },
      { label: 'Akar Pangkat n', latex: '\\sqrt[n]{x}' },
      { label: 'Plus Minus', latex: '\\pm' },
      { label: 'Kali Silang', latex: '\\times' },
      { label: 'Bagi', latex: '\\div' },
    ],
  },
  {
    category: 'Relasi & Perbandingan',
    items: [
      { label: 'Kurang Dari Sama Dengan', latex: '\\le' },
      { label: 'Lebih Dari Sama Dengan', latex: '\\ge' },
      { label: 'Tidak Sama Dengan', latex: '\\neq' },
      { label: 'Mendekati / Kira-kira', latex: '\\approx' },
      { label: 'Tak Hingga', latex: '\\infty' },
    ],
  },
  {
    category: 'Simbol Sains & Yunani',
    items: [
      { label: 'Pi', latex: '\\pi' },
      { label: 'Alpha', latex: '\\alpha' },
      { label: 'Beta', latex: '\\beta' },
      { label: 'Theta', latex: '\\theta' },
      { label: 'Delta', latex: '\\Delta' },
      { label: 'Lambda', latex: '\\lambda' },
      { label: 'Omega', latex: '\\Omega' },
      { label: 'Mikro', latex: '\\mu' },
    ],
  },
  {
    category: 'Kalkulus & Statistika',
    items: [
      { label: 'Integral Tentu', latex: '\\int_{a}^{b} f(x) \\, dx' },
      { label: 'Integral Tak Tentu', latex: '\\int f(x) \\, dx' },
      { label: 'Sigma (Penjumlahan)', latex: '\\sum_{i=1}^{n} x_i' },
      { label: 'Limit', latex: '\\lim_{x \\to 0} f(x)' },
      { label: 'Rata-rata (X bar)', latex: '\\bar{x}' },
    ],
  },
  {
    category: 'Matriks & Vektor',
    items: [
      { label: 'Matriks 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
      { label: 'Vektor Kolom', latex: '\\begin{pmatrix} x \\\\ y \\end{pmatrix}' },
      { label: 'Determinan 2x2', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
    ],
  },
  {
    category: 'Kimia & Reaksi',
    items: [
      { label: 'Air (H2O)', latex: '\\text{H}_2\\text{O}' },
      { label: 'Karbon Dioksida', latex: '\\text{CO}_2' },
      { label: 'Tanda Reaksi', latex: '\\rightarrow' },
      { label: 'Reaksi Kesetimbangan', latex: '\\rightleftharpoons' },
    ],
  },
];

export function EquationHelperModal({ isOpen, onClose, onInsert }: EquationHelperModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(PRESETS[0].category);
  const [customInput, setCustomInput] = useState('');
  const [isBlockMode, setIsBlockMode] = useState(false);

  const activePreset = PRESETS.find((p) => p.category === selectedCategory) || PRESETS[0];

  const handleInsert = (latex: string) => {
    const formatted = isBlockMode ? `\n$$${latex}$$\n` : `$${latex}$`;
    onInsert(formatted);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Bantuan Penulisan Rumus Matematika (KaTeX)</span>
        </div>
      }
      description="Pilih template rumus atau ketik LaTeX untuk disisipkan langsung ke soal ujian."
      size="2xl"
    >
      <div className="space-y-4">
        {/* Toggle Mode Inline vs Display Block */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Format Penyisipan:
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBlockMode(false)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                !isBlockMode
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Inline ($...$)
            </button>
            <button
              type="button"
              onClick={() => setIsBlockMode(true)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                isBlockMode
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Block Tengah ($$...$$)
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
          {PRESETS.map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() => setSelectedCategory(cat.category)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat.category
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* Grid of Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
          {activePreset.items.map((item, idx) => {
            const previewHtml = renderMathOnly(`$${item.latex}$`);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsert(item.latex)}
                className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 transition-all text-center group"
              >
                <div
                  className="min-h-[36px] flex items-center justify-center text-slate-900 dark:text-slate-100 group-hover:scale-110 transition-transform"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Input & Live Preview */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Ketik Rumus Kustom (LaTeX):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Contoh: x = \frac{-b \pm \sqrt{D}}{2a}"
              className="flex-1 text-sm font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!customInput.trim()}
              onClick={() => handleInsert(customInput.trim())}
            >
              Sisipkan
            </Button>
          </div>
          {customInput.trim() && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">Pratinjau Hasil:</span>
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMathOnly(`$${customInput}$`),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
