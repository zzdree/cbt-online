-- ============================================================================
-- CBT ONLINE - CLOUDFLARE D1 (SQLITE) SCHEMA
-- Database: cbt-online-db
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Table: users (Guru & Administrator)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'teacher',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 2. Table: exams (Sesi Ujian)
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  passing_grade REAL DEFAULT 75.0,
  show_score_immediately INTEGER DEFAULT 1,
  show_review_immediately INTEGER DEFAULT 0,
  randomize_questions INTEGER DEFAULT 0,
  randomize_options INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_exams_token ON exams(token);
CREATE INDEX IF NOT EXISTS idx_exams_is_active ON exams(is_active);

-- 3. Table: questions (Bank Soal)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  image_url TEXT,
  points REAL DEFAULT 10.0,
  explanation TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);

-- 4. Table: question_options (Pilihan Jawaban A..E)
CREATE TABLE IF NOT EXISTS question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  option_key TEXT NOT NULL,
  option_text TEXT NOT NULL,
  image_url TEXT,
  is_correct INTEGER DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON question_options(question_id);

-- 5. Table: exam_attempts (Sesi Pengerjaan Siswa)
CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  student_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  start_time TEXT DEFAULT (datetime('now', 'localtime')),
  submit_time TEXT,
  duration_seconds_left INTEGER,
  status TEXT DEFAULT 'in_progress',
  lockout_until TEXT,
  violation_count INTEGER DEFAULT 0,
  score REAL,
  is_passed INTEGER,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_student ON exam_attempts(exam_id, student_number);

-- 6. Table: attempt_answers (Jawaban & Flag Ragu Siswa)
CREATE TABLE IF NOT EXISTS attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_id TEXT,
  is_hesitant INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE(attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON attempt_answers(attempt_id);

-- 7. Table: violation_logs (Log Pelanggaran Anti-Cheat 30s)
CREATE TABLE IF NOT EXISTS violation_logs (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  occurred_at TEXT DEFAULT (datetime('now', 'localtime')),
  duration_seconds INTEGER DEFAULT 30,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_violations_attempt_id ON violation_logs(attempt_id);

-- 8. Table: settings (Pengaturan Sistem & KiosAPI)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 9. Table: uploaded_images (gambar soal/opsi disimpan sebagai data URI karena
--    Cloudflare Workers tidak dapat menulis ke disk)
CREATE TABLE IF NOT EXISTS uploaded_images (
  id TEXT PRIMARY KEY,
  mime_type TEXT NOT NULL,
  data_url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
