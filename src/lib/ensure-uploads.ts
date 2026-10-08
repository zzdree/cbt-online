import { getDb } from '@/lib/db';

const CREATE_UPLOADED_IMAGES = `CREATE TABLE IF NOT EXISTS uploaded_images (
   id TEXT PRIMARY KEY,
   mime_type TEXT NOT NULL,
   data_url TEXT NOT NULL,
   created_at TEXT
 )`;

// D1's exec() accepts a single statement, so each CREATE goes through prepare().run().
// node:sqlite's exec() is only used where a multi-statement string is safe.
export async function ensureUploadedImagesTable(): Promise<void> {
  const db = await getDb();
  await db.prepare(CREATE_UPLOADED_IMAGES).run();
}
