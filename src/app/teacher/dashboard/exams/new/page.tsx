'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, KeyRound } from 'lucide-react';

export default function NewExamPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    subject: '',
    token: '',
    duration_minutes: 60,
    passing_grade: 75,
    show_score_immediately: true,
    show_review_immediately: false,
    randomize_questions: false,
    randomize_options: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let t = '';
    for (let i = 0; i < 6; i++) {
      t += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm({ ...form, token: t });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) {
      setError('Judul dan mata pelajaran wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat ujian');

      // Go directly to question builder for this new exam
      router.push(`/teacher/dashboard/exams/${data.id}/questions`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>

        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Buat Sesi Ujian Baru
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur parameter ujian, durasi, kode akses, dan visibilitas nilai siswa.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Judul Ujian <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Penilaian Akhir Semester - Matematika Wajib"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Contoh: Fisika, Biologi, Kimia"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kode / Token Ujian (6 Karakter)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.token}
                    onChange={(e) => setForm({ ...form, token: e.target.value.toUpperCase() })}
                    placeholder="Auto jika kosong"
                    maxLength={10}
                    className="flex-1 text-sm font-mono tracking-wider uppercase px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={generateRandomToken}
                    title="Acak Kode Ujian"
                  >
                    <KeyRound className="w-4 h-4" /> Acak
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Durasi Ujian (Menit)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Passing Grade (KKM)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passing_grade}
                  onChange={(e) => setForm({ ...form, passing_grade: Number(e.target.value) })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Score Visibility Setting (Crucial Requirement) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Pengaturan Hasil &amp; Integritas
              </span>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                    Tampilkan Nilai Langsung ke Siswa
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Jika nonaktif, siswa hanya melihat layar konfirmasi pengumpulan tanpa skor.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.show_score_immediately}
                  onChange={(e) =>
                    setForm({ ...form, show_score_immediately: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                    Tampilkan Pembahasan Soal
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Hanya berlaku jika nilai langsung ditampilkan.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.show_review_immediately}
                  onChange={(e) =>
                    setForm({ ...form, show_review_immediately: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button href="/teacher/dashboard" type="button" variant="ghost">
                Batal
              </Button>
              <Button type="submit" variant="success" size="lg" isLoading={loading}>
                Lanjut ke Input Soal
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
