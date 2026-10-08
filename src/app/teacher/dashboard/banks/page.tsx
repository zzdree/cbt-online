'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ArrowLeft, Plus, Trash2, Pencil, Library } from 'lucide-react';

interface QuestionBank {
  id: string;
  name: string;
  subject: string;
  description?: string | null;
  item_count?: number;
}

export default function QuestionBanksPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchBanks = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/banks');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat bank soal');
      setBanks(data.banks || []);
    } catch (err: any) {
      setError('Gagal memuat bank soal. Periksa koneksi jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const openCreate = () => {
    setEditingBank(null);
    setForm({ name: '', subject: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (bank: QuestionBank) => {
    setEditingBank(bank);
    setForm({
      name: bank.name,
      subject: bank.subject,
      description: bank.description || '',
    });
    setModalOpen(true);
  };

  const saveBank = async () => {
    setSaving(true);
    try {
      const res = await fetch(editingBank ? '/api/teacher/banks' : '/api/teacher/banks', {
        method: editingBank ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingBank
            ? { id: editingBank.id, ...form }
            : form
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan bank soal');
      setModalOpen(false);
      setError('');
      await fetchBanks();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan bank soal');
    } finally {
      setSaving(false);
    }
  };

  const deleteBank = async (bank: QuestionBank) => {
    if (!confirm(`Hapus bank soal "${bank.name}" beserta seluruh butir soalnya?`)) return;
    const res = await fetch(`/api/teacher/banks?id=${bank.id}`, { method: 'DELETE' });
    if (res.ok) fetchBanks();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Bank Soal</h1>
              <p className="text-[11px] text-slate-500">Kumpulkan butir soal untuk dipakai berulang</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/teacher/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Daftar Bank Soal</h2>
            <p className="text-sm text-slate-500 mt-1">
              Butir soal di sini bisa disalin ke banyak ujian berbeda.
            </p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Bank Soal Baru
          </Button>
        </div>

        {loading ? (
          <Card className="p-12 text-center text-sm text-slate-500">Memuat bank soal...</Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchBanks}>
              Coba Lagi
            </Button>
          </Card>
        ) : banks.length === 0 ? (
          <Card className="p-12 text-center">
            <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Belum ada bank soal
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Buat bank soal pertama, lalu tambahkan butir soal secara manual atau lewat AI.
            </p>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Buat Bank Soal
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((bank) => (
              <Card key={bank.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="brand">{bank.subject}</Badge>
                    <span className="text-xs text-slate-500">{bank.item_count ?? 0} butir</span>
                  </div>
                  <Link href={`/teacher/dashboard/banks/${bank.id}`}>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {bank.name}
                    </h3>
                  </Link>
                  {bank.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{bank.description}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/teacher/dashboard/banks/${bank.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Buka Bank Soal
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => openEdit(bank)} title="Edit bank soal">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteBank(bank)} title="Hapus bank soal">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBank ? 'Edit Bank Soal' : 'Bank Soal Baru'}
        description="Pisahkan bank soal per mata pelajaran agar mudah dicari nanti."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Bank Soal <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Matematika Wajib Kelas 10"
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Contoh: Matematika"
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan (opsional)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contoh: Soal latihan persiapan penilaian akhir semester"
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={saveBank}
              isLoading={saving}
              disabled={!form.name.trim() || !form.subject.trim()}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
