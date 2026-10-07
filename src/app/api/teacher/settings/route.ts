import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    // Mask API key: only show last 4 chars
    if (settings.kiosapi_key) {
      const key = settings.kiosapi_key;
      settings.kiosapi_key_masked =
        key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****';
      delete settings.kiosapi_key;
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now', 'localtime'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    if ('kiosapi_key' in body && body.kiosapi_key) {
      upsert.run('kiosapi_key', body.kiosapi_key);
    }
    if ('kiosapi_base_url' in body && body.kiosapi_base_url) {
      upsert.run('kiosapi_base_url', body.kiosapi_base_url);
    }
    if ('kiosapi_model' in body && body.kiosapi_model) {
      upsert.run('kiosapi_model', body.kiosapi_model);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
