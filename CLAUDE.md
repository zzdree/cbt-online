# CBT Online: Developer Guide

Sistem ujian online berbasis Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, SQLite, dan KaTeX.

## Perintah Utama

- `npm run dev`, Menjalankan development server pada http://localhost:3000
- `npm run build`, Kompilasi build produksi Next.js
- `npm run start`, Menjalankan build produksi
- `npx tsx scripts/test-cbt.ts`, Menjalankan rangkaian uji verifikasi sistem

## Arsitektur & Aturan

> Baca `HANDOFF.md` di root repo untuk status terkini, jebakan runtime, dan daftar pekerjaan sisa.

- **Database**: SQLite bawaan Node.js (`node:sqlite`) di `./cbt.db` untuk dev/lokal, dan Cloudflare D1 (`env.DB`) di produksi. Pemilihan runtime ditentukan oleh keberadaan global `WebSocketPair` di `src/lib/db.ts`. Jangan memakai binding D1 di Node biasa: ia menunjuk emulator kosong dan setiap kueri gagal `no such table`.
- **Gambar soal**: Cloudflare Worker tidak boleh menulis disk. Gambar disimpan sebagai data URI di tabel `uploaded_images` (D1/lokal) dan dilayani lewat `/api/teacher/upload/[imageId]`, batas 500 KB. Lihat `src/lib/ensure-uploads.ts`.
- **Anti-Cheat 30 Detik**:
  - Dikelola oleh hook di `src/app/exam/[attemptId]/page.tsx` via `visibilitychange` & `window.blur`.
  - Server memvalidasi dan menyimpan `lockout_until` di `src/app/api/student/lockout/route.ts`.
  - Pembukaan kunci divalidasi oleh `src/app/api/student/unlock/route.ts`.
- **Rich Math & Tables**:
  - Semua narasi soal dan opsi yang memuat KaTeX atau Tabel Markdown diproses melalui `src/lib/rich-parser.ts` dan dirender oleh `<RichContent />`.
- **KiosAPI AI Integration**:
  - Client pemanggil KiosAPI berada di `src/lib/kiosapi.ts` dan diakses melalui route handler `/api/ai/generate/route.ts`.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->
