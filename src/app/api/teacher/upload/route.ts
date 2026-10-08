import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureUploadedImagesTable } from '@/lib/ensure-uploads';

const MAX_UPLOAD_BYTES = 500 * 1024;

// Cloudflare Workers cannot write to disk, so the image is stored in D1 as a
// data URI and served back straight from the database row.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang dipilih' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file harus berupa gambar (JPG, PNG, WebP, GIF, SVG)' },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Ukuran gambar maksimal ${MAX_UPLOAD_BYTES / 1024} KB (batas penyimpanan database)` },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const db = await getDb();
    await ensureUploadedImagesTable();
    await db.prepare(
      'INSERT INTO uploaded_images (id, mime_type, data_url, created_at) VALUES (?, ?, ?, ?)'
    ).run(imageId, file.type, `data:${file.type};base64,${bytes.toString('base64')}`, new Date().toISOString());

    return NextResponse.json({ success: true, url: `/api/teacher/upload/${imageId}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengunggah gambar' }, { status: 500 });
  }
}
