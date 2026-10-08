'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KeyRound, Hash, User, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function StudentEnterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ token: '', student_number: '', student_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.token.trim() || !form.student_number.trim() || !form.student_name.trim()) {
      setError('Semua kolom wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/student/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: form.token.trim().toUpperCase(),
          student_number: form.student_number.trim(),
          student_name: form.student_name.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal masuk ujian');

      // Store minimal attempt info in sessionStorage for resume
      sessionStorage.setItem(
        'cbt_attempt',
        JSON.stringify({
          attempt_id: data.attempt_id,
          exam_id: data.exam.id,
        })
      );

      router.push(`/exam/${data.attempt_id}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <Card className="p-6 sm:p-8">
          <div className="text-center mb-7">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center mb-4">
              <KeyRound className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Portal Ujian Siswa</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Masukkan kode ujian dari pengawas untuk memulai.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Kode / Token Ujian
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value.toUpperCase() })}
                  placeholder="Contoh: CBT2026"
                  maxLength={10}
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Peserta / NISN
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.student_number}
                  onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                  placeholder="Contoh: 2026001"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  placeholder="Nama lengkap sesuai daftar hadir"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
              Masuk ke Ruang Ujian
            </Button>
          </form>

          {/* Warning notice */}
          <div className="mt-6 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Perhatian:</strong> Selama ujian berlangsung, membuka tab atau jendela lain akan
              mengunci layar Anda selama <strong>30 detik</strong>. Kuncian tetap berlaku meskipun
              halaman di-refresh.
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
