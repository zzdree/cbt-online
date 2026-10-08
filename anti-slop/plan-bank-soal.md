# Rencana: Bank Soal & Prapakai Nyata

Dokumen rencana untuk menjadikan CBT Online sistem nyata, bukan demo.

## 1. Pembersihan data sensitif

| Item | Lokasi | Tindakan |
|---|---|---|
| Kredensial `guru` / `guru123` | halaman login, seed DB | Hapus; akun awal memakai username acak dan password yang wajib diganti |
| Nama pribadi pembuat | navbar guru, tabel `users` | Ganti menjadi identitas dari server, bukan teks tetap |
| Soal contoh | seed DB | Dianggap materi demo, boleh dihapus karena akan diganti bank soal sekolah |
| Berkas `cbt.db` | repo git | Keluar dari repo; berisi identitas pengguna sungguhan |
| Uji percobaan dari verifikasi | D1 produksi | Hapus baris `exam_attempts` dan `attempt_answers` milik sesi uji |

## 2. Bank Soal (fitur baru)

Tujuan: soal bisa dibuat sekali, lalu dipakai berulang untuk banyak ujian.

Pendekatan yang dipilih: tabel bank soal terpisah dari tabel soal ujian, dengan
hubungan salinan. Alasan: ujian yang sudah pernah dikerjakan siswa tidak boleh
berubah isinya jika soal di bank diedit. Jadi ujian menyimpan salinan soal.

### Model data

```
question_banks        kategori bank soal, misalnya "Matematika Kelas 10"
question_bank_items   butir soal milik satu bank, tanpa terikat ujian
questions            soal milik satu ujian, bisa hasil salinan dari bank
```

Alur: guru membuat soal di bank (manual atau lewat AI), nanti saat menyusun ujian
ia memilih butir dari bank dan menyalinnya ke ujian. Bank tetap menjadi pemilik
versi asli, ujian memegang salinan yang membeku.

### Halaman yang dibutuhkan

- `/teacher/dashboard/banks` daftar bank soal, tombol bank baru
- `/teacher/dashboard/banks/[bankId]` isi bank soal, pakai kembali editor yang ada
- Tombol "Ambil dari Bank Soal" pada halaman penyusun soal ujian

## 3. Peningkatan pemakaian nyata

- Ganti kata sandi guru dari dashboard, bukan hanya lewat seed
- Ringkasan kelas yang lebih berguna: rata-rata, tertinggi, terendah
- Token ujian yang bisa dimatikan agar sesi berikutnya tidak bisa masuk lagi
- Pembersihan otomatis jawaban percobaan pada halaman monitor