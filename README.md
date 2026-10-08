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

## Bank Soal (pemakaian berulang)

Bank soal memisahkan penulisan butir soal dari penyusunan ujian, sehingga satu butir
soal bisa dipakai pada banyak ujian berbeda tanpa perlu mengetik ulang.

Cara kerjanya:

1. Guru membuat bank soal per mata pelajaran, misalnya "Matematika Kelas 10".
2. Butir soal ditulis manual lewat editor, atau dihasilkan AI lalu ditinjau sebelum disimpan.
3. Saat menyusun ujian, guru membuka "Ambil dari Bank Soal" dan memilih butir yang dipakai.
4. Ujian menyimpan **salinan** butir soal, jadi kalau bank kemudian diperbaiki, ujian
   yang sudah dikerjakan siswa tidak berubah isinya.

Menu Bank Soal ada pada dashboard guru.

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

### 4. Instalasi pemakaian nyata

Langkah ini **wajib** dilakukan sebelum sistem dipakai siswa.

1. **Ganti akun awal.** Berkas `migrations/0002_initial_seed.sql` membuat satu akun
   sementara dengan username `admin`. Segera setelah basis data dibuat, masuk lewat
   `/teacher/login`, lalu ganti username dan password tersebut dengan akun milik sekolah.

2. **Hapus materi contoh.** Ujian dan soal contoh yang dibuat saat instalasi bisa
   dihapus dari dashboard selain yang memang ingin dipertahankan.

3. **Atur kunci KiosAPI.** Buka dashboard guru, klik **"Pengaturan AI"**:
   - **Kunci KiosAPI**: masukkan kunci milik sekolah
   - **Base URL**: `https://api.kiosapi.com/v1`
   - **Model**: `deepseek-chat` (cepat dan murah), `deepseek-reasoner` (untuk soal
     bertingkat analisis), `gpt-4o-mini`, atau `gpt-4o`

   Kunci disimpan di basis data sekolah sendiri, tidak pernah ikut dalam kode.

4. **Buat token ujian.** Saat membuat ujian, sistem menghasilkan token 6 karakter.
   Token inilah yang dibagikan ke siswa. Token bisa diganti kapan saja dari dashboard.

### 5. Soal, kunci jawaban, dan pembahasan

Setiap butir soal mendukung rumus matematika, tabel, gambar, serta kunci jawaban dan
pembahasan. Bagian pembahasan hanya terlihat bila guru mengaktifkan switch
"Tampilkan Pembahasan" pada pengaturan ujian.

---

## Pengujian Otomatis

---
*Dibangun untuk Andreas Restuawanta Christwara (`zzdree`) atas permintaan mitra pengguna.*
