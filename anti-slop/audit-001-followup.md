# Laporan Perbaikan Audit #001

- **Proyek**: CBT Online
- **Tanggal**: 2026-10-09
- **Sumber temuan**: `anti-slop/audit-001-2026-10-08.md`
- **Persetujuan pengguna**: perbaiki semua temuan nomor 1 sampai 16

## Ringkasan

Semua 16 temuan diperbaiki. Selain itu, click-through pada server yang berjalan menemukan
satu bug fungsional di luar laporan audit, yaitu kegagalan total API pada runtime lokal,
yang juga sudah diperbaiki dan diverifikasi.

## Status per temuan

| # | Aturan | Tindakan | Status |
|---|---|---|---|
| 1 | R-02 em dash | Diganti dengan titik dua/koma di `layout.tsx`, `page.tsx`, `LockoutModal.tsx`, README, CLAUDE.md | Selesai |
| 2 | R-25 kontras terang | `text-slate-400` dinaikkan ke `slate-600` (teks) dan `slate-500` (ikon) di 17 file | Selesai |
| 3 | R-25 kontras gelap | `dark:text-slate-500/600` diganti ke `dark:text-slate-400` | Selesai |
| 4 | R-32 fokus opsi jawaban | `focus-visible:ring` ditambahkan pada opsi jawaban, tombol ragu-ragu, dan tombol tutup drawer | Selesai |
| 5 | R-32 Escape modal | Listener Escape + `role="dialog"`, `aria-modal`, `aria-labelledby`, pemulihan fokus pada `Modal` | Selesai |
| 6 | R-32 lightbox | Pembungkus `div onClick` dijadikan `button` sungguhan; Escape listener; ARIA dialog | Selesai |
| 7 | R-03 target sentuh | `Button sm` 32px menjadi 40px plus utilitas `.touch-target` (area sentuh 44px), grid navigasi `min-h-[44px]`, tombol Modal/Lightbox/drawer diperbesar | Selesai |
| 8 | R-27 error state | State error + tombol "Coba Lagi" di 3 halaman guru; banner pemulihan mandiri di monitor | Selesai |
| 9 | R-21 / R-34 tema | Komponen `ThemeToggle` (Terang/Gelap) dipasang di header ujian siswa, navbar guru, dan halaman login, dengan skrip anti-FOUC | Selesai |
| 10 | R-37 arah desain | `DESIGN.md` dibuat: palet, tipografi, target sentuh, aksesibilitas, dial ENERGY 1 / RHYTHM 2 / MOTION 1 | Selesai |
| 11 | R-04 ikon AI generik | `Sparkles` turun dari 6 situs menjadi 1, yaitu tombol "Buat Soal AI (KiosAPI)" yang memang menamai fitur AI. Sisanya menjadi `BookOpen`, `BookOpenCheck`, `Cpu`, `ListChecks` | Selesai |
| 12 | R-08 panah tombol | Panah `→` dihapus dari teks tombol di `page.tsx` dan form ujian baru | Selesai |
| 13 | R-09 eyebrow badge | Pill badge di atas H1 pada beranda dihapus; judul kembali memimpin hierarki | Selesai |
| 14 | R-19 dot berkedip | Dot amber dekoratif di `LockoutModal` dihapus | Selesai |
| 15 | R-26 / HTML | 10 pemakaian `<Link>` yang membungkus `<Button>` diubah menjadi `<Button href>`; import `Link` yang tak terpakai dibersihkan | Selesai |
| 16 | antislop-code | Banner `// -----`, penomoran `// Step 1`, dan komentar pembentuk kasus disederhanakan menjadi baris yang membawa alasan nyata. Hanya komentar yang diubah | Selesai |

## Temuan tambahan hasil verifikasi

### 17. Bug fungsional: seluruh API gagal di runtime lokal

Click-through pada server yang benar-benar berjalan menemukan `D1_ERROR: no such table: users`
pada `/api/teacher/login`, `/api/teacher/exams`, dan `/api/student/enter`. Build produksi lulus
sehingga bug ini tidak terdeteksi oleh kompilasi.

Penyebab, diperiksa lewat route probe sementara: di `next start`, runtime melaporkan
`NEXT_RUNTIME=nodejs` dan `WebSocketPair` tidak terdefinisi, tetapi binding `DB` tetap ada
dan mengarah ke emulator D1 lokal yang kosong karena migrasi hanya dijalankan terhadap D1
remote. Akibatnya `getDb()` memilih jalur D1 padahal berjalan di Node biasa.

Perbaikan di `src/lib/db.ts`: deteksi runtime pekerja (`WebSocketPair`) menjadi syarat
penggunaan D1. Pada Node biasa, koneksi jatuh ke berkas SQLite lokal sehingga pengembangan
lokal berjalan tanpa migrasi tambahan.

Catatan: `LockoutModal` tidak memakai komponen `Modal` generik dan tidak punya listener
Escape, sehingga hukuman 30 detik tetap tidak dapat dibatalkan lewat keyboard.

## Verifikasi yang dijalankan

Bukti berikut berasal dari server produksi yang benar-benar berjalan, bukan dari kompilasi saja.

- `npx tsc --noEmit` bersih, exit 0.
- `npx next build` sukses, 23 rute terkompilasi.
- HTML ter-render pada beranda: judul sudah memakai titik dua, eyebrow badge hilang, 0 em dash.
- Login guru benar 200, password salah benar 401, daftar ujian terisi, token ujian salah benar 404.
- Alur anti-cheat 30 detik: pemicu lockout mencatat pelanggaran dan sisa 30 detik; unlock dini
  ditolak 403; pembacaan ulang state setelah refresh tetap menunjukkan sisa hukuman; unlock
  setelah 30 detik berhasil 200.
- Kedua mode visibilitas nilai: dengan toggle aktif, skor 100 beserta pembahasan terkirim;
  dengan toggle nonaktif, payload membawa `score` bernilai null dan menahan pembahasan serta
  kunci jawaban, sementara sisi guru tetap menyimpan skor 100 untuk rekap.
- Delivery Gate antislop Blok 1 sampai 4 dijalankan dan dilaporkan.

## Catatan jujur

Responsif antarmuka diverifikasi lewat audit kode penyebab overflow (tabel soal memakai
`overflow-x: auto`, drawer memakai `max-h-[75vh]`, tidak ada elemen berlebar tetap) tetapi
belum diverifikasi secara visual pada perangkat nyata, karena browser otomasi tidak tersedia
di mesin ini. Uji visual pada ponsel tetap disarankan.

Satu cacat yang ditemukan dan diperbaiki saat pemeriksaan: `ExamHeader` memakai kelas
`xs:inline` padahal breakpoint `xs` tidak didefinisikan pada konfigurasi Tailwind, sehingga
kelas itu mati dan label "Soal" selalu tampil di layar sempit. Sudah diganti menjadi `sm:inline`.
