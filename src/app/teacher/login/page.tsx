'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Presentation, Lock, User, ArrowLeft } from 'lucide-react';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('guru');
  const [password, setPassword] = useState('guru123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');

      localStorage.setItem('cbt_teacher_user', JSON.stringify(data.user));
      router.push('/teacher/dashboard');
    } catch (err: any) {
      setError(err.message || 'Username atau password salah');
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
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-4">
              <Presentation className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Masuk Dashboard Guru
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Kelola ujian, buat soal, dan monitor ujian siswa.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username guru"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="success"
              size="lg"
              className="w-full"
              isLoading={loading}
            >
              Masuk
            </Button>
          </form>

          <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs text-slate-500 dark:text-slate-400">
            Akun bawaan demo: Username <strong>guru</strong> · Password <strong>guru123</strong>
          </div>
        </Card>
      </div>
    </main>
  );
}
