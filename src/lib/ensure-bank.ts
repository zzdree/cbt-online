import { getDb } from '@/lib/db';

// D1 and node:sqlite both reject a repeated ALTER TABLE, so the column is added
// only after checking the table's actual columns.
export async function ensureQuestionBankSchema(): Promise<void> {
  const db = await getDb();

  await db.prepare(`CREATE TABLE IF NOT EXISTS question_banks (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS question_bank_items (
    id TEXT PRIMARY KEY,
    bank_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    question_text TEXT NOT NULL,
    image_url TEXT,
    points REAL DEFAULT 10.0,
    explanation TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS question_bank_item_options (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    option_key TEXT NOT NULL,
    option_text TEXT NOT NULL,
    image_url TEXT,
    is_correct INTEGER DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES question_bank_items(id) ON DELETE CASCADE
  )`).run();

  const columns = (await db.prepare('PRAGMA table_info(questions)').all()) as {
    name: string;
  }[];
  const hasSourceColumn = columns.some((c) => c.name === 'source_bank_item_id');
  if (!hasSourceColumn) {
    await db.prepare('ALTER TABLE questions ADD COLUMN source_bank_item_id TEXT').run();
  }
}
