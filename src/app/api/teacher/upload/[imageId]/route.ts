import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureUploadedImagesTable } from '@/lib/ensure-uploads';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await params;

  try {
    const db = await getDb();
    await ensureUploadedImagesTable();

    const row = await db.prepare('SELECT mime_type, data_url FROM uploaded_images WHERE id = ?').get<{
      mime_type: string;
      data_url: string;
    }>(imageId);

    if (!row) {
      return new NextResponse('Gambar tidak ditemukan', { status: 404 });
    }

    const base64 = row.data_url.split(',')[1] || '';
    return new NextResponse(Buffer.from(base64, 'base64'), {
      headers: {
        'Content-Type': row.mime_type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message || 'Gagal memuat gambar', { status: 500 });
  }
}
