import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

function verifyPassword(plain: string, stored: string): boolean {
  // Menopang akun lama yang belum di-hash, sambil memakai bcrypt bila memungkinkan
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(plain, stored);
    } catch {
      return false;
    }
  }
  return stored === plain;
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const user = (await db
      .prepare('SELECT id, username, name, role, password_hash FROM users WHERE username = ?')
      .get(String(username).trim())) as any;

    // Pesan sengaja sama agar tidak membocorkan username mana yang terdaftar
    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
