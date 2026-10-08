# Catatan Lanjut untuk Agent Berikutnya

Terakhir diperbarui: 9 Oktober 2026, oleh Claude Code (sesi penutupan).

## Status ringkas

Sistem CBT Online sudah berfungsi dan terpasang di Cloudflare.

- Live: https://cbt-online.zzdree.workers.dev
- Repo GitHub: https://github.com/zzdree/cbt-online
- Direktori lokal: `/home/zzdree/ANDREAS/cbt-online`
- Database produksi: Cloudflare D1 bernama `cbt-online-db`
  (id `421cdad7-fffe-4000-a6e7-979d0919acd8`)

Fitur yang diminta pemilik proyek sudah ada dan sudah diuji pada server yang berjalan:
ujian responsif, pengunci 30 detik saat siswa pindah tab, penyiapan soal manual dengan
rumus matematika, tabel, dan gambar, serta sakelar tampil atau sembunyi nilai.

Pengecualian: pembuat soal otomatis lewat KiosAPI sudah ditulis, tetapi belum pernah
dicoba ke server KiosAPI, jadi belum terbukti bekerja. Lihat bagian "Yang belum selesai".

## Yang sudah dikerjakan pada sesi ini

1. Audit visual dan aksesibilitas terhadap aturan `antislop`, 16 temuan diperbaiki.
   Dokumentasinya ada di `anti-slop/audit-001-2026-10-08.md` dan
   `anti-slop/audit-001-followup.md`.
2. Bug serius diperbaiki: seluruh endpoint API gagal `no such table` saat aplikasi
   dijalankan biasa di Node. Rincian akar masalah ada di bagian berikut.
3. Unggahan gambar soal sempat rusak di produksi karena menulis ke disk. Sudah diganti ke
   penyimpanan data URI di D1 dan diuji ulang pada server lokal maupun produksi Cloudflare.

## Hal yang wajib dipahami sebelum mengubah kode

### Jalur database, jangan porting D1 ke Node biasa

`src/lib/db.ts` memakai keberadaan objek global `WebSocketPair` untuk membedakan runtime.
Pada Cloudflare Worker, kueri masuk ke binding D1. Pada Node biasa, kueri masuk ke berkas
SQLite `cbt.db`.

Alasannya: saat `next start` biasa, `NEXT_RUNTIME` bernilai `nodejs`, `WebSocketPair` tidak
ada, tetapi `getCloudflareContext()` tetap mengembalikan binding `DB`. Binding itu menunjuk ke
emulator D1 lokal yang kosong, dan kueri apa pun langsung gagal. Jadi penanda dari
`NEXT_RUNTIME` saja tidak cukup; pakai deteksi `WebSocketPair`.

### Gambar soal tidak boleh ditulis ke disk

Cloudflare Worker bersifat hanya-baca terhadap berkas. Endpoint
`/api/teacher/upload` menyimpan gambar sebagai teks base64 di tabel `uploaded_images` pada D1,
lalu melayaninya kembali lewat `/api/teacher/upload/[imageId]`. Batas ukuran berkas adalah
500 KB. R2 belum aktif pada akun Cloudflare saat ini, jadi jangan menjadikan R2 pilihan
tanpa mengaktifkannya lebih dulu.

### Modal pengunci sengaja tanpa tombol Escape

`src/components/student/LockoutModal.tsx` tidak memakai komponen `Modal` generik dan tidak
punya dengar pada tombol Escape. Ini bukan kelalaian. Modal tersebut adalah hukuman kecurangan;
kalau bisa ditutup dari keyboard maka hukuman tidak berlaku.

## Yang belum selesai

Berikut daftar jujur dari pekerjaan tersisa, bukan klaim selesai.

- **Penilaian visual di perangkat sungguhan belum pernah dilakukan.** Responsif hanya
  diperiksa dari pola kode penyebab overflow dan pengukuran lewat server. Silakan buka situs
  di ponsel atau pakai Playwright (`npx playwright install chrome`) untuk memastikan tata letak
  dan daftar soal di layar sempit.
- **Verifikasi pembuat soal otomatis KiosAPI belum lunas.** Kode wajib melakukan satu
  percakapan HTTP ke KiosAPI dan belum pernah dicoba di produksi, sehingga kualitas keluaran
  bahasa Indonesia dan kebenaran skema JSON belum pernah terbukti. Jalankan pengecekan nyata
  sebelum mengumumkan fitur ini final. Letaknya di `/teacher/dashboard/settings`, lalu buka
  tombol "Buat Soal AI" pada halaman pengelolaan soal.
- **Rekapitulasi dan ekspor rekap nilai belum diuji.** Fungsinya ada, tetapi belum pernah
  diklik sampai selesai.
- **Acak soal serta acak opsi jawaban** tersimpan pada basis data, tetapi tidak dipakai pada
  ruang ujian. Kalau perlu, terapkan urutan acak tetap per siswa dengan penyemut khusus, agar
  tampilan tidak berubah saat halaman disegarkan.

## Perintah yang sering dipakai

```bash
cd /home/zzdree/ANDREAS/cbt-online
npm run dev                                # pengembangan di http://localhost:3000
npx tsx scripts/test-cbt.ts                # pengujian unit lokal
npm run deploy                             # build OpenNext lalu deploy Cloudflare
```

Akun guru contoh: username `guru`, kata sandi `guru123`. Kode ujian contoh: `CBT2026`.
