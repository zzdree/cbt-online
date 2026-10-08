import Link from 'next/link';
import { BookOpenCheck, GraduationCap, Presentation, ShieldCheck, Table2, Timer } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            CBT <span className="text-brand-600 dark:text-brand-400">Online</span>
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Platform ujian online responsif untuk siswa dan guru, lengkap dengan anti-cheat 30 detik,
            editor soal matematis, dan generator soal AI.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link
            href="/exam"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-floating hover:border-brand-400 dark:hover:border-brand-600 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Masuk sebagai Siswa</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Kerjakan ujian dengan kode kelas. Terdeteksi pindah tab = terkunci 30 detik.
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium mt-4 group-hover:gap-2 transition-all">
              Buka Portal Ujian
            </span>
          </Link>

          <Link
            href="/teacher/login"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-floating hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Presentation className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Masuk sebagai Guru</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Kelola ujian, buat soal manual atau AI, atur visibilitas nilai, dan monitor siswa.
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium mt-4 group-hover:gap-2 transition-all">
              Buka Dashboard Guru
            </span>
          </Link>
        </div>

        {/* Feature Strip */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { icon: ShieldCheck, label: 'Anti-Cheat 30s', desc: 'Kebal refresh' },
            { icon: BookOpenCheck, label: 'Soal AI', desc: 'DeepSeek & GPT' },
            { icon: Table2, label: 'Tabel & Gambar', desc: 'Konten kaya' },
            { icon: Timer, label: 'Timer Presisi', desc: 'Sinkron server' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2.5 p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70"
            >
              <f.icon className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{f.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-10">
          CBT Online · Dibangun dengan Next.js &amp; KaTeX
        </p>
      </div>
    </main>
  );
}
