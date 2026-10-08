# CBT Online: Sistem Ujian Online Berbasis Web

> 🌐 **Live Demo Cloudflare**: [https://cbt-online.zzdree.workers.dev](https://cbt-online.zzdree.workers.dev)  
> 📦 **GitHub Repository**: [https://github.com/zzdree/cbt-online](https://github.com/zzdree/cbt-online)

Sistem Ujian Online Berbasis Komputer (CBT / Computer-Based Test) modern yang responsif di desktop maupun smartphone, dilengkapi sistem integritas anti-cheat dengan penalti **lockout 30 detik kebal refresh**, editor soal kaya fitur (rumus matematika KaTeX, generator tabel, dan upload gambar), generator soal otomatis menggunakan AI (**KiosAPI DeepSeek / GPT**), serta pengaturan visibilitas nilai oleh guru.

---

## Fitur Utama

### 1. Modul Siswa (Student Exam Runner)
- **Akses Mudah & Cepat**: Masuk menggunakan **Kode/Token Ujian (6 karakter)** + **Nomor Peserta / NISN** + **Nama Lengkap** tanpa registrasi akun yang rumit.
- **Tampilan Responsif (Mobile & Desktop)**:
  - **Desktop**: Split screen dengan panel navigasi soal 1..N di sidebar kanan, indikator status 3 warna (🟢 Hijau: Dijawab, 🟡 Kuning: Ragu-ragu, ⚪ Abu-abu: Belum dijawab).
  - **Mobile**: Header ringkas sticky dengan countdown timer presisi, navigasi soal lewat Bottom Sheet Drawer yang ramah jempol.
- **Mekanisme Anti-Cheat 30 Detik (Kebal Refresh)**:
  - Sensor `visibilitychange` & `window.blur` mendeteksi saat siswa berpindah tab browser, membuka aplikasi lain, atau meminimalkan layar.
  - Soal di belakang langsung diburamkan (`filter: blur(16px)`) agar tidak bisa difoto atau dibaca saat siswa mencari jawaban.
  - **Countdown penalti 30 detik**: Siswa terkunci dan tidak bisa mengerjakan soal selama 30 detik.
  - **Anti-Bypass Protection**: Jika siswa me-refresh halaman (F5) atau menutup dan membuka kembali tab, server memeriksa sisa waktu lockout. Ujian **tetap terkunci** sampai 30 detik tuntas!
  - Setelah 30 detik habis, tombol *"Saya Mengerti & Lanjutkan Ujian"* aktif setelah divalidasi oleh server.
  - Setiap pelanggaran dicatat ke log server dan dapat dilihat oleh pengawas secara real-time.
- **Layar Hasil Ujian Dinamis**:
  - Jika Guru mengatur nilai langsung muncul: Skor akhir, persentase, status kelulusan KKM, dan pembahasan soal (opsional) ditampilkan.
  - Jika Guru mengatur nilai disembunyikan: Tampil pesan konfirmasi penyerahan ujian ("Jawaban Anda telah tersimpan dengan aman di server") tanpa menampilkan nilai atau membocorkannya di network payload.

### 2. Modul Guru (Teacher / Administrator)
- **Manajemen Ujian**:
  - Buat dan edit ujian: Judul, Mata Pelajaran, Token Ujian, Durasi (menit), KKM (Passing Grade).
  - **Toggle Visibilitas Nilai**: Switch *"Tampilkan Nilai Langsung ke Siswa"* (Aktif / Nonaktif).
  - **Toggle Pembahasan**: Switch *"Tampilkan Pembahasan Soal"* (Aktif / Nonaktif).
- **Editor Soal Manual Kaya Fitur**:
  - **Equation Helper (KaTeX)**: Tombol shortcut cepat untuk rumus pecahan `\frac{a}{b}`, akar `\sqrt{x}`, pangkat `x^2`, integral `\int`, sigma `\sum`, simbol Yunani `\pi, \alpha, \beta`, matriks, dan reaksi kimia dengan live preview instan.
  - **Table Generator**: Dialog pembuat tabel data berkolom dan berbaris yang otomatis diubah ke tabel responsif (horizontal scroll di HP).
  - **Dukungan Gambar**: Unggah berkas gambar (**maks 500 KB**) atau tempel URL gambar pada narasi soal maupun pilihan jawaban A-E. Berkas hasil unggahan disimpan sebagai data URI di D1, karena Cloudflare Workers tidak boleh menulis ke disk. Untuk gambar lebih besar, gunakan URL berkas yang sudah dihosting di tempat lain.
- **Generator Soal Otomatis Menggunakan AI (KiosAPI)**:
  - Terintegrasi dengan **KiosAPI** (OpenAI-compatible) menggunakan model **DeepSeek** (`deepseek-chat`, `deepseek-reasoner`) atau **GPT** (`gpt-4o-mini`, `gpt-4o`).
  - Guru menentukan topik materi, tingkat kesulitan (Mudah, Sedang, Sulit, HOTS), jenjang kelas, jumlah soal, dan opsi rumus/tabel.
  - **Staging & Review Board**: Guru dapat meninjau, mengedit teks atau kunci jawaban, mencentang soal yang disetujui, dan mengimpor sekaligus dengan 1 klik.
- **Live Monitoring & Proctoring**:
  - Pemantauan real-time status pengerjaan siswa: *Sedang Mengerjakan*, *Terkunci 30s (Pelanggaran)*, *Selesai*.
  - Log jumlah pelanggaran pindah tab siswa secara live.
  - Rekapitulasi nilai dengan fitur **Ekspor ke CSV/Excel** dan tombol **Cetak / PDF**.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Math Rendering**: KaTeX 0.16
- **Database**: Cloudflare D1 di produksi (SQLite di tepi), dan SQLite berkas lokal (`node:sqlite`) untuk pengembangan maupun pengetesan offline.
- **AI Engine**: KiosAPI (REST OpenAI-compatible via `/v1/chat/completions`)

### Cara pemilihan database

Server mendeteksi runtime pekerja lewat keberadaan objek `WebSocketPair`. Pada Cloudflare Worker, binding `env.DB` (D1) dipakai. Pada `next dev` atau `next start` biasa, aplikasi memakai berkas `cbt.db` di lokal, sehingga tidak perlu migrasi tambahan untuk pengembangan.

> Catatan penting: jangan memanggil D1 pada Node biasa tanpa pemeriksaan ini. Di runtime lokal binding D1 tetap terlihat, tetapi ia menunjuk ke emulator yang kosong sehingga setiap kueri gagal dengan `no such table`.

---

## Cara Menjalankan

### 1. Prasyarat
- Node.js versi 22 atau yang lebih baru (rekomendasi Node v24).

### 2. Jalankan Mode Pengembangan
```bash
npm install
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 3. Build & Jalankan Mode Produksi
```bash
npm run build
npm run start
```

### 4. Akun Default Guru (Demo)
- **URL Login Guru**: `/teacher/login`
- **Username**: `guru`
- **Password**: `guru123`

### 5. Kode Token Ujian Simulasi
- **Token Ujian**: `CBT2026`
- Berisi 5 contoh soal komprehensif: Aljabar KaTeX, Fisika GLBB dengan tabel, Kalkulus Integral, Kimia Stoikiometri, dan Statistika Frekuensi.

### 6. Konfigurasi KiosAPI (AI Generator)
Masuk ke dashboard guru → Klik tombol **"Pengaturan AI"** di pojok kanan atas:
- **KiosAPI Secret Key**: Masukkan API Key dari akun KiosAPI Anda.
- **Base URL**: `https://api.kiosapi.com/v1`
- **Pilihan Model**: `deepseek-chat`, `deepseek-reasoner`, `gpt-4o-mini`, `gpt-4o`.

---

## Pengujian Otomatis

Jalankan test suite verifikasi:
```bash
npx tsx scripts/test-cbt.ts
```

---
*Dibuat oleh Andreas Restuawanta Christwara (`zzdree`).*
