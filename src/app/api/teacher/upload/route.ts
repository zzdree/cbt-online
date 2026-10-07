import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang dipilih' }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus berupa gambar (JPG, PNG, WebP, GIF, SVG)' }, { status: 400 });
    }

    // Size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran gambar maksimal 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate safe unique filename
    const ext = path.extname(file.name) || '.png';
    const filename = `cbt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengunggah gambar' }, { status: 500 });
  }
}
