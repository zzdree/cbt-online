import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const user = db
      .prepare('SELECT id, username, name, role, password_hash FROM users WHERE username = ?')
      .get(username.trim()) as any;

    if (!user) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Plain comparison for seeded demo account (password_hash stores plain in seed for simplicity)
    // In production, replace with bcrypt.compare
    const passwordMatch = user.password_hash === password;

    if (!passwordMatch) {
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
