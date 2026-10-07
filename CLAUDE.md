# CBT Online — Developer Guide

Sistem ujian online berbasis Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, SQLite, dan KaTeX.

## Perintah Utama

- `npm run dev` — Menjalankan development server pada http://localhost:3000
- `npm run build` — Kompilasi build produksi Next.js
- `npm run start` — Menjalankan build produksi
- `npx tsx scripts/test-cbt.ts` — Menjalankan rangkaian uji verifikasi sistem

## Arsitektur & Aturan

- **Database**: Menggunakan SQLite bawaan Node.js (`node:sqlite`) yang tersimpan di `./cbt.db`. Singleton connection diinisialisasi di `src/lib/db.ts`.
- **Anti-Cheat 30 Detik**:
  - Dikelola oleh hook di `src/app/exam/[attemptId]/page.tsx` via `visibilitychange` & `window.blur`.
  - Server memvalidasi dan menyimpan `lockout_until` di `src/app/api/student/lockout/route.ts`.
  - Pembukaan kunci divalidasi oleh `src/app/api/student/unlock/route.ts`.
- **Rich Math & Tables**:
  - Semua narasi soal dan opsi yang memuat KaTeX atau Tabel Markdown diproses melalui `src/lib/rich-parser.ts` dan dirender oleh `<RichContent />`.
- **KiosAPI AI Integration**:
  - Client pemanggil KiosAPI berada di `src/lib/kiosapi.ts` dan diakses melalui route handler `/api/ai/generate/route.ts`.

## antislop
Terapkan prinsip desain antislop: tipografi akademis bersih, kontras tinggi (WCAG AAA), touch targets minimal 48px pada mobile, dan tanpa elemen visual berlebih yang mengganggu konsentrasi ujian.
