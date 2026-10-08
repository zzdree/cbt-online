'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import {
  Presentation,
  Plus,
  Settings,
  BookOpen,
  Activity,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  Library,
} from 'lucide-react';
import { Exam } from '@/types';

export default function TeacherDashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cbt_teacher_user');
      if (raw) {
        const parsed = JSON.parse(raw) as { name?: string };
        if (parsed.name) setTeacherName(parsed.name);
      }
    } catch {
      // identitas hanya untuk tampilan; kegagalan baca tidak boleh memblokir dashboard
    }
  }, []);

  const fetchExams = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/exams');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat daftar ujian');
      setExams(data.exams || []);
    } catch (err: any) {
      setError('Gagal memuat daftar ujian. Periksa koneksi jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const deleteExam = async (id: string, title: string) => {
    if (!confirm(`Hapus ujian "${title}" beserta semua soalnya?`)) return;
    const res = await fetch(`/api/teacher/exams?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchExams();
  };

  const toggleScoreVisibility = async (exam: Exam) => {
    const nextVal = exam.show_score_immediately === 1 ? 0 : 1;
    await fetch('/api/teacher/exams', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: exam.id, show_score_immediately: nextVal }),
    });
    fetchExams();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Dashboard Guru
              </h1>
              <p className="text-[11px] text-slate-500">{teacherName || 'Guru'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button href="/teacher/dashboard/banks" variant="outline" size="sm">
              <Library className="w-4 h-4" /> Bank Soal
            </Button>
            <Button href="/teacher/dashboard/settings" variant="outline" size="sm">
              <Settings className="w-4 h-4" /> Pengaturan AI
            </Button>
            <Button href="/teacher/login" variant="ghost" size="sm" title="Keluar">
              <LogOut className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Daftar Ujian</h2>
            <p className="text-sm text-slate-500 mt-1">
              Kelola jadwal ujian, bank soal, dan pantau aktivitas peserta ujian.
            </p>
          </div>
          <Button href="/teacher/dashboard/exams/new" variant="success" size="md">
            <Plus className="w-4 h-4" /> Buat Ujian Baru
          </Button>
        </div>

        {error ? (
          <Card className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-base font-semibold text-rose-700 dark:text-rose-300">
              Gagal Memuat Daftar Ujian
            </h3>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-1 mb-5">
              Gagal memuat daftar ujian. Periksa koneksi jaringan Anda.
            </p>
            <Button variant="outline" onClick={() => fetchExams()}>
              Coba Lagi
            </Button>
          </Card>
        ) : loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Memuat daftar ujian...</div>
        ) : exams.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Belum Ada Ujian
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Klik tombol di bawah untuk membuat sesi ujian pertama Anda.
            </p>
            <Button href="/teacher/dashboard/exams/new" variant="success">
              Buat Ujian Baru
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="flex flex-col justify-between p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="brand">{exam.subject}</Badge>
                    <button
                      type="button"
                      onClick={() => copyToken(exam.token)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                      title="Klik untuk salin kode token ujian"
                    >
                      <Copy className="w-3 h-3 text-slate-500" />
                      {copiedToken === exam.token ? 'Tersalin!' : exam.token}
                    </button>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Durasi: {exam.duration_minutes} Menit · KKM: {exam.passing_grade} ·{' '}
                    <strong>{exam.question_count || 0} Soal</strong>
                  </p>
                </div>

                {/* Score visibility toggle */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Nilai Siswa:</span>
                  <button
                    type="button"
                    onClick={() => toggleScoreVisibility(exam)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-colors ${
                      exam.show_score_immediately === 1
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                    title="Klik untuk ubah visibilitas nilai siswa"
                  >
                    {exam.show_score_immediately === 1 ? (
                      <>
                        <Eye className="w-3 h-3 text-emerald-600" /> Langsung Muncul
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-500" /> Disembunyikan
                      </>
                    )}
                  </button>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    href={`/teacher/dashboard/exams/${exam.id}/questions`}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    title="Kelola Soal"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Soal
                  </Button>

                  <Button
                    href={`/teacher/dashboard/exams/${exam.id}/monitor`}
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    title="Live Monitoring Siswa & Pelanggaran"
                  >
                    <Activity className="w-3.5 h-3.5" /> Monitor
                  </Button>

                  <button
                    type="button"
                    onClick={() => deleteExam(exam.id, exam.title)}
                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition-colors"
                    title="Hapus Ujian"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
