# DESIGN.md — CBT Online Design System

> Sistem Desain Resmi untuk CBT Online (Computer-Based Test)
> Berorientasi pada kenyamanan kognitif akademis, bebas kelelahan mata (*zero cognitive fatigue*), dan mematuhi standar *anti-slop*.

---

## 1. Aesthetic Thesis & Identity

- **Karakter Utama**: Serius, tenang, presisi, dan akademis (*Dignified Slate & Academic Indigo*).
- **Tujuan Pengalaman**: Siswa dapat membaca teks soal panjang, tabel data rumit, dan rumus matematika dengan kejernihan maksimal selama 60 hingga 120 menit tanpa gangguan visual.
- **Prinsip Anti-Slop**:
  - Nol gradien ungu-biru generik.
  - Nol animasi berulang tanpa henti (*no endless pulses/floats*).
  - Nol lencana kapsul dekoratif tanpa fungsi nyata.
  - Setiap teknik visual memiliki alasan hierarki yang tertulis.

---

## 2. Three Dials (R-37)

| Dial | Nilai | Penjelasan |
| :--- | :--- | :--- |
| **ENERGY** | **1 (Calm)** | Lingkungan ujian menuntut ketenangan absolut. Warna aksen digunakan secara hemat hanya untuk interaksi penting dan status. |
| **RHYTHM** | **2 (Balanced)** | Tata letak terstruktur konsisten dengan variasi fungsional antara area soal, opsi pilihan ganda, dan panel navigasi soal. |
| **MOTION** | **1 (Static/Subtle)** | Gerakan terbatas pada transisi hover (150ms) dan pembukaan modal. Tidak ada elemen yang beranimasi terus-menerus. |

---

## 3. Palet Warna & Token Semantik (WCAG AA Compliant)

### 3.1 Mode Terang (Default)
- **Canvas Base**: `#F8FAFC` (`bg-slate-50`)
- **Card Surface**: `#FFFFFF` (`bg-white`), Border: `#E2E8F0` (`border-slate-200`)
- **Teks Utama**: `#0F172A` (`text-slate-900`, rasio 16.5:1 terhadap putih)
- **Teks Sekunder**: `#475569` (`text-slate-600`, rasio 7.58:1 terhadap putih)
- **Aksen Primer**: `#4F46E5` (`brand-600` / Academic Indigo)
- **Status Terjawab**: `#059669` (`emerald-600`)
- **Status Ragu-Ragu**: `#D97706` (`amber-600`)
- **Status Peringatan / Kunci**: `#E11D48` (`rose-600`)

### 3.2 Mode Gelap (Dark Mode)
- **Canvas Base**: `#090D16` (`bg-slate-950`)
- **Card Surface**: `#0F172A` (`bg-slate-900`), Border: `#1E293B` (`border-slate-800`)
- **Teks Utama**: `#F8FAFC` (`text-slate-50`)
- **Teks Sekunder**: `#94A3B8` (`text-slate-400`, rasio 8.2:1 terhadap `#090D16`)
- **Aksen Primer**: `#818CF8` (`brand-400`)

---

## 4. Tipografi

- **Font Sans Utama**: `Plus Jakarta Sans`, `Inter`, `system-ui`
  - Body Text Soal: `15px` - `16px`, `line-height: 1.6` untuk kenyamanan membaca stimulus teks panjang.
- **Font Monospace / Data**: `JetBrains Mono`
  - Digunakan khusus untuk timer countdown, token ujian, nomor peserta, dan kode LaTeX mentah.
- **Font Matematika**: KaTeX Computer Modern font stack.

---

## 5. Skala Jarak & Target Sentuh (Mobile Layout)

- **Minimum Touch Target**: Minimal `44px` untuk semua tombol dan opsi jawaban di perangkat sentuh.
- **Spasi Antara Target**: Minimal `8px` pemisah untuk menghindari salah sentuh pada layar kecil.
- **Drawer Navigasi Soal**: Bottom sheet drawer dengan grid nomor soal berukuran ergonomis (`min-h-[40px]`).

---

## 6. Aksesibilitas (WCAG 2.1 AA)

- Setiap kontrol interaktif wajib memiliki `:focus-visible` ring kontras tinggi.
- Semua modal dialog wajib dapat ditutup dengan tombol keyboard `Escape`.
- Tidak ada indikasi status yang hanya mengandalkan warna semata (selalu disertai teks atau ikon pendukung).
