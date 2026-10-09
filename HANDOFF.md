# Catatan Lanjut untuk Agent Berikutnya

Terakhir diperbarui: 9 Oktober 2026, oleh Claude Code (sesi penutupan, putaran kedua).

## Status ringkas

Sistem CBT Online untuk pemakaian nyata di sekolah swasta, bukan demo lagi.

- Live: https://cbt-online.zzdree.workers.dev
- Repo GitHub: https://github.com/zzdree/cbt-online
- Direktori lokal: `/home/zzdree/ANDREAS/cbt-online`
- Database produksi: Cloudflare D1 bernama `cbt-online-db`
  (id `421cdad7-fffe-4000-a6e7-979d0919acd8`)

Fitur yang sudah ada dan sudah diuji pada server yang berjalan: ujian responsif, pengunci
30 detik saat siswa pindah tab, penyiapan soal manual dengan rumus matematika, tabel, dan
gambar, pembuat soal AI, sakelar tampil atau sembunyi nilai, serta bank soal untuk
pemakaian butir soal berulang.

Pengecualian: pembuat soal AI sudah ditulis tetapi belum pernah dicoba ke server KiosAPI,
jadi kualitas soalnya belum terbukti.

## Data sensitif sudah dibersihkan, jangan dikembalikan

- Kredensial `guru` / `guru123` sudah dihapus dari tampilan dan dari basis data. Berkas
  seed kini membuat akun awal `admin` dengan password yang sengaja tidak dapat dipakai.
- Nama pribadi pembuat tidak lagi tertulis di navbar maupun data login. Identitas di
  layar diambil dari data pengguna yang sedang masuk.
- Berkas `cbt.db` sudah masuk `.gitignore` dan dilepas dari git. Berkas itu berisi data
  pengguna sungguhan, jadi jangan di-commit kembali.

## Bank soal

Soal ditulis sekali di bank soal, lalu disalin ke banyak ujian. Ujian menyimpan salinan,
sehingga perbaikan di bank tidak mengubah ujian yang sudah dikerjakan siswa.

- Tabel: `question_banks`, `question_bank_items`, `question_bank_item_options`
- Kolom jejak asal: `questions.source_bank_item_id`
- Halaman: `/teacher/dashboard/banks` dan `/teacher/dashboard/banks/[bankId]`
- Penyalinan ke ujian: `POST /api/teacher/exams/copy-from-bank`
- Pembuatan tabel dilakukan kode supaya aman diulang: `src/lib/ensure-bank.ts`

## Hal yang wajib dipahami sebelum mengubah kode

### Jalur database, jangan pakai D1 di Node biasa

`src/lib/db.ts` memakai keberadaan objek global `WebSocketPair` untuk membedakan runtime.
Pada Cloudflare Worker, kueri masuk ke binding D1. Pada Node biasa, kueri masuk ke berkas
SQLite `cbt.db`.

Alasannya: saat `next start` biasa, `NEXT_RUNTIME` bernilai `nodejs`, `WebSocketPair` tidak
ada, tetapi `getCloudflareContext()` tetap mengembalikan binding `DB`. Binding itu menunjuk ke
emulator D1 lokal yang kosong, dan kueri apa pun langsung gagal. Penanda `NEXT_RUNTIME`
saja tidak cukup; pakai deteksi `WebSocketPair`.

### Gambar soal tidak boleh ditulis ke disk

Cloudflare Worker bersifat hanya-baca terhadap berkas. Endpoint `/api/teacher/upload`
menyimpan gambar sebagai teks base64 di tabel `uploaded_images` pada D1, lalu melayananya
kembali lewat `/api/teacher/upload/[imageId]`. Batas ukuran berkas 500 KB. R2 belum aktif
pada akun Cloudflare saat ini, jadi jangan memilih R2 tanpa mengaktifkannya lebih dulu.

### D1 menolak `exec()` multi pernyataan

Pembuatan tabel di runtime harus lewat `prepare().run()` (lihat `src/lib/ensure-bank.ts`
dan `src/lib/ensure-uploads.ts`). Memakai `exec()` untuk beberapa pernyataan akan gagal
dengan galat `incomplete input`.

### Modal pengunci sengaja tanpa tombol Escape

`src/components/student/LockoutModal.tsx` tidak memakai komponen `Modal` generik dan tidak
mendengar tombol Escape. Ini bukan kelalaian. Modal tersebut hukuman kecurangan, kalau bisa
ditutup dari keyboard maka hukuman tidak berlaku.

## Yang belum selesai

Berikut daftar jujur pekerjaan tersisa, bukan klaim selesai.

- **Penilaian visual di perangkat sungguhan belum pernah dilakukan.** Responsif hanya
  diperiksa dari pola kode penyebab overflow dan pengujian lewat server. Silakan buka situs
  di ponsel, atau pasang Playwright (`npx playwright install chrome`) untuk memastikan tata
  letak dan daftar soal pada layar sempit.
- **Pembuat soal AI KiosAPI belum punya bukti berhasil.** Belum ada percobaan ke server
  sungguhan, sehingga kualitas soal bercitra belum teruji. Letaknya di
  `/teacher/dashboard/settings`, lalu tombol "Buat dengan AI" pada halaman bank soal.
- **Ekspor rekap nilai CSV dan cetak PDF belum diuji sampai selesai.**
- **Acak soal serta acak opsi jawaban** tersimpan pada basis data tetapi belum dipakai di
  ruang ujian. Jika perlu, terapkan urutan acak tetap per siswa agar tampilan tidak berubah
  saat halaman disegarkan.
- **Penggantian kata sandi guru dari aplikasi belum ada.** Sekarang kata sandi baru hanya
  bisa diganti langsung pada tabel `users`, sehingga guru tidak bisa melakukannya sendiri.

## Perintah yang sering dipakai

```bash
cd /home/zzdree/ANDREAS/cbt-online
npm run dev                                # pengembangan di http://localhost:3000
npx tsx scripts/test-cbt.ts                # pengujian unit lokal
npm run deploy                             # build OpenNext lalu deploy Cloudflare
```
