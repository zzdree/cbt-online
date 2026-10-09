# Informasi Penerima Sistem

Dokumen ini mencatat siapa pemakai sistem ini, supaya siapa pun yang melanjutkan
pekerjaan memahami konteksnya, bukan sekadar melihat kode.

## Sekolah

**PKBM Eagle School Semarang**

- Jenjang: pendidikan kesetaraan, Paket B (setara SMP) dan Paket C (setara SMA)
- Alamat: Jl. Delta Mas VII No. 63-65, Kelurahan Kuningan, Kec. Semarang Utara, Kota Semarang, Jawa Tengah
- Telepon: +62 822-4040-7078
- Situs: www.eagleschool.id
- Status: swasta, naungan Yayasan Higher Than Ever
- Ketua PKBM: Dedie Yulianto, S.Kom.

Sekolah ini menekankan pengembangan keterampilan selain pelajaran formal, antara lain
multimedia dan teknologi informasi. Karena itulah sistem ujian online ini diperlukan:
peserta didik paket C sering mempelajari materi teknik, jadi soal perlu mendukung
rumus matematika, tabel, dan gambar, bukan hanya teks biasa.

## Penanggung Jawab di Sekolah

**Samuel Jordan**, guru.

- Lulusan S1 Teknik Informatika Universitas Negeri Semarang, wisuda periode 108 tahun 2021
- Latar belakang pengembangan web, sehingga terbiasa mengelola sistem berbasis web
- Terlibat di bidang multimedia

Karena Samuel sendiri lulusan teknologi informasi, ia bisa mengelola pengaturan sistem
sendiri, termasuk bila kelak ingin memakai layanan AI melalui KiosAPI.

## Hubungan Pemilik Sistem dan Sekolah

Sistem ini dipesan oleh Andreas Restuawanta Christwara (`zzdree`) sebagai wakil
pembangun kepada Samuel Jordan, yang memakainya untuk kegiatan ujian di sekolahnya.
Andreas tidak terlibat dalam operasional harian sekolah, jadi perubahan kebijakan
ujian, pertanyaan data siswa, dan isi soal sepenuhnya wewenang pihak sekolah.

## Apa yang Harus Dijaga Sekolah

1. Kunci KiosAPI, bila dipakai. Kunci dibayar oleh sekolah dan disimpan pada basis
   data sekolah sendiri.
2. Data pribadi peserta didik. Jangan menyalinnya ke tempat lain tanpa izin.
3. Kata sandi guru. Ganti secara berkala dari database.

## Yang Bisa Dilakukan Pembangun

Perbaikan cacat, penambahan fitur bila diminta, dan bantuan pindah perangkat.

Yang BUKAN wewenang pembangun: menentukan isi soal, kebijakan ujian, dan pemulihan
nilai.
