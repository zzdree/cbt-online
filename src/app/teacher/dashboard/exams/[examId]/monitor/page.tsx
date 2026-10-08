'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Activity,
  RefreshCw,
  ShieldAlert,
  Download,
  Users,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
} from 'lucide-react';

export default function ExamMonitorPage({ params }: { params: Promise<{ examId: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;

  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const [examRes, monRes] = await Promise.all([
        fetch('/api/teacher/exams'),
        fetch(`/api/teacher/monitor?exam_id=${examId}`),
      ]);

      const examsData = await examRes.json();
      const currentExam = (examsData.exams || []).find((e: any) => e.id === examId);
      setExam(currentExam);

      const monData = await monRes.json();
      setAttempts(monData.attempts || []);
      setError('');
      setHasLoadedOnce(true);
    } catch (err: any) {
      // Live monitoring: keep the last good data and surface a compact banner.
      // The auto-refresh interval keeps running so the view can self-recover.
      setError('Gagal menyegarkan data. Menampilkan data terakhir yang berhasil dimuat.');
    } finally {
      // A monitoring screen has no meaningful "loaded" state before the first
      // successful poll; stay on the loading state until then so the table
      // never renders empty data as if it were authoritative.
      if (hasLoadedOnce) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  // Polling every 5 seconds for live monitor updates
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, examId]);

  const exportCSV = () => {
    if (attempts.length === 0) {
      alert('Belum ada data peserta untuk diekspor');
      return;
    }

    const headers = [
      'Nomor Peserta',
      'Nama Siswa',
      'Status',
      'Progres',
      'Pelanggaran (Pindah Tab)',
      'Nilai Akhir',
      'Status KKM',
      'Waktu Mulai',
      'Waktu Selesai',
    ];

    const rows = attempts.map((a) => [
      `"${a.student_number}"`,
      `"${a.student_name}"`,
      `"${a.status === 'submitted' ? 'Selesai' : a.status === 'locked' ? 'Terkunci 30s' : 'Mengerjakan'}"`,
      `"${a.answered_count}/${a.total_questions}"`,
      a.violation_count,
      a.score ?? '-',
      a.is_passed === 1 ? 'Lulus' : a.is_passed === 0 ? 'Tidak Lulus' : '-',
      `"${a.start_time}"`,
      `"${a.submit_time || '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_nilai_${exam?.token || examId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeCount = attempts.filter((a) => a.status === 'in_progress').length;
  const lockedCount = attempts.filter((a) => a.status === 'locked').length;
  const finishedCount = attempts.filter((a) => a.status === 'submitted').length;
  const totalViolations = attempts.reduce((acc, a) => acc + (a.violation_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 print:p-0 print:bg-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href={`/teacher/dashboard/exams/${examId}/questions`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Soal
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40'
                  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh (5s): {autoRefresh ? 'AKTIF' : 'NONAKTIF'}
            </button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Ekspor CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Cetak / PDF
            </Button>
          </div>
        </div>

        {/* Title Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="brand">{exam?.subject || 'Mata Pelajaran'}</Badge>
                <Badge variant="slate">Token: {exam?.token || '---'}</Badge>
                <Badge variant="emerald">Live Proctoring</Badge>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Pemantauan Ujian: {exam?.title || 'Memuat...'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Pantau status pengerjaan, deteksi kecurangan real-time, dan rekapitulasi nilai siswa.
              </p>
            </div>
          </div>

          {/* Refresh failure banner, shown only after a previously successful
              load. The polling interval keeps running so the dashboard can
              recover on its own. */}
          {error && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">Total Peserta</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {attempts.length}
              </div>
            </div>
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Sedang Mengerjakan
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {activeCount}
              </div>
            </div>
            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                Terkunci 30s (Curang)
              </span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {lockedCount}
              </div>
            </div>
            <div className="p-3 bg-brand-50/60 dark:bg-brand-950/20 rounded-xl">
              <span className="text-[11px] text-brand-700 dark:text-brand-400 font-medium">
                Sudah Selesai
              </span>
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                {finishedCount}
              </div>
            </div>
          </div>
        </Card>

        {/* Live Proctoring & Result Table */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" /> Daftar Aktivitas &amp; Nilai Peserta ({attempts.length})
            </h2>
            {totalViolations > 0 && (
              <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Total {totalViolations} Insiden Pelanggaran Terdeteksi
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              {error ? (
                <span className="flex flex-col items-center gap-3">
                  <span className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </span>
                  <Button variant="outline" onClick={() => fetchData()}>
                    Coba Lagi
                  </Button>
                </span>
              ) : (
                'Memuat data peserta...'
              )}
            </div>
          ) : attempts.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Belum ada siswa yang masuk ke sesi ujian ini. Bagikan token{' '}
              <strong className="font-mono text-brand-600 font-bold">{exam?.token}</strong> kepada siswa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <th className="p-3 font-semibold">No. Peserta</th>
                    <th className="p-3 font-semibold">Nama Siswa</th>
                    <th className="p-3 font-semibold">Status Pengerjaan</th>
                    <th className="p-3 font-semibold">Progres Soal</th>
                    <th className="p-3 font-semibold">Pelanggaran (Pindah Tab)</th>
                    <th className="p-3 font-semibold">Nilai Akhir</th>
                    <th className="p-3 font-semibold">Status KKM</th>
                    <th className="p-3 font-semibold">Waktu Mulai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attempts.map((a) => {
                    const isLocked = a.status === 'locked';
                    const isSubmitted = a.status === 'submitted';

                    return (
                      <tr
                        key={a.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          isLocked ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-medium">{a.student_number}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                          {a.student_name}
                        </td>
                        <td className="p-3">
                          {isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200">
                              <CheckCircle2 className="w-3 h-3" /> Selesai
                            </span>
                          ) : isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-600 text-white animate-pulse">
                              <ShieldAlert className="w-3 h-3" /> Terkunci ({a.lockout_remaining}s)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200">
                              <Clock className="w-3 h-3 text-emerald-600" /> Mengerjakan
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          {a.answered_count} / {a.total_questions}
                        </td>
                        <td className="p-3">
                          {a.violation_count > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                              <ShieldAlert className="w-3.5 h-3.5" /> {a.violation_count}× pelanggaran
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">0 (Tertib)</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-sm">
                          {a.score != null ? (
                            a.score
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400 font-normal">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {a.is_passed === 1 ? (
                            <Badge variant="emerald">Lulus</Badge>
                          ) : a.is_passed === 0 ? (
                            <Badge variant="rose">Belum Lulus</Badge>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {a.start_time}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
