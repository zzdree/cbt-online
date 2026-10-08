'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RichContent } from '@/components/shared/RichContent';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { QuestionEditorModal } from '@/components/teacher/QuestionEditorModal';
import { AIBankGeneratorModal } from '@/components/teacher/AIBankGeneratorModal';
import { ArrowLeft, Plus, Sparkles, Pencil, Trash2, Library } from 'lucide-react';

interface BankItem {
  id: string;
  question_text: string;
  points: number;
  explanation?: string | null;
  image_url?: string | null;
  options: {
    id: string;
    option_key: string;
    option_text: string;
    image_url?: string | null;
    is_correct: number;
  }[];
}

export default function BankItemsPage() {
  const params = useParams<{ bankId: string }>();
  const bankId = params.bankId;

  const [bankInfo, setBankInfo] = useState<{ name: string; subject: string; description?: string | null } | null>(
    null
  );
  const [items, setItems] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BankItem | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const fetchData = async () => {
    setError('');
    setLoading(true);
    try {
      const [itemsRes, banksRes] = await Promise.all([
        fetch(`/api/teacher/banks/items?bank_id=${bankId}`),
        fetch('/api/teacher/banks'),
      ]);
      if (!itemsRes.ok || !banksRes.ok) throw new Error('gagal');

      const itemsData = await itemsRes.json();
      const banksData = await banksRes.json();
      setItems(itemsData.items || []);
      const banks = banksData.banks || [];
      const found = banks.find((b: any) => b.id === bankId);
      if (found) {
        setBankInfo({ name: found.name, subject: found.subject, description: found.description });
      }
    } catch {
      setError('Gagal memuat isi bank soal. Periksa koneksi jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankId]);

  const deleteItem = async (id: string) => {
    if (!confirm('Hapus butir soal ini dari bank soal?')) return;
    const res = await fetch(`/api/teacher/banks/items?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <Library className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {bankInfo?.name || 'Bank Soal'}
              </h1>
              <p className="text-[11px] text-slate-500">
                {bankInfo?.subject} · {items.length} butir soal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/teacher/dashboard/banks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Semua Bank
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Butir Soal</h2>
            <p className="text-sm text-slate-500 mt-1">
              Tulis manual, atau hasilkan dengan AI lalu tinjau sebelum disimpan.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingItem(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Tambah Manual
            </Button>
            <Button variant="primary" onClick={() => setAiOpen(true)}>
              <Sparkles className="w-4 h-4 text-amber-300" /> Buat dengan AI
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="p-12 text-center text-sm text-slate-500">Memuat butir soal...</Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchData}>
              Coba Lagi
            </Button>
          </Card>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Bank soal masih kosong
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Tambahkan butir soal manual, atau buat otomatis dengan bantuan AI.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingItem(null);
                  setEditorOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> Tambah Manual
              </Button>
              <Button variant="primary" onClick={() => setAiOpen(true)}>
                <Sparkles className="w-4 h-4" /> Buat dengan AI
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <Card key={item.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-500">{item.points} poin</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setEditorOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit butir soal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus butir soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm">
                  <RichContent content={item.question_text} imageUrl={item.image_url} />
                </div>

                <div className="space-y-1.5 pt-2">
                  {item.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`text-xs p-2.5 rounded-lg border flex items-start gap-2.5 ${
                        opt.is_correct === 1
                          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          opt.is_correct === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.option_key}
                      </span>
                      <div className="flex-1 pt-0.5">
                        <RichContent content={opt.option_text} imageUrl={opt.image_url} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Editor manual memakai komponen yang sama dengan ujian */}
      <QuestionEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        examId={bankId}
        mode="bank"
        initialQuestion={editingItem as any}
        onSaved={fetchData}
      />

      <AIBankGeneratorModal
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        bankId={bankId}
        subject={bankInfo?.subject || ''}
        onSaved={fetchData}
      />
    </div>
  );
}
