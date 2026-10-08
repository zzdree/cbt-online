-- ============================================================================
-- CBT ONLINE - BANK SOAL (003)
-- Menjalankan berkas ini pada basis data yang sudah ada. Setiap pernyataan
-- ditulis agar aman bila dijalankan berulang.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- Kategori bank soal milik sekolah
CREATE TABLE IF NOT EXISTS question_banks (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_banks_teacher ON question_banks(teacher_id);

-- Butir soal di bank, belum terikat ujian tertentu
CREATE TABLE IF NOT EXISTS question_bank_items (
  id TEXT PRIMARY KEY,
  bank_id TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  image_url TEXT,
  points REAL DEFAULT 10.0,
  explanation TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bank_items_bank ON question_bank_items(bank_id);

-- Pilihan jawaban butir soal di bank
CREATE TABLE IF NOT EXISTS question_bank_item_options (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  option_key TEXT NOT NULL,
  option_text TEXT NOT NULL,
  image_url TEXT,
  is_correct INTEGER DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES question_bank_items(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bank_options_item ON question_bank_item_options(item_id);

-- Jejak asal soal ujian, berguna bila butir di bank kelak diperbarui
-- SQLite tidak mendukung ADD COLUMN IF NOT EXISTS, jadi kolom ditambahkan
-- melalui pemeriksaan pragma_table_info di kode (src/lib/ensure-bank.ts).
