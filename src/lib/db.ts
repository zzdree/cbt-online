import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'cbt.db');

// Singleton connection
let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'teacher',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

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

    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      option_key TEXT NOT NULL,
      option_text TEXT NOT NULL,
      image_url TEXT,
      is_correct INTEGER DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS violation_logs (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      occurred_at TEXT DEFAULT (datetime('now', 'localtime')),
      duration_seconds INTEGER DEFAULT 30,
      FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Seed default teacher if not exists
  const existingTeacher = db.prepare('SELECT id FROM users WHERE username = ?').get('guru');
  if (!existingTeacher) {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('user_guru_01', 'guru', 'guru123', 'Bpk. Andreas R.C., S.T.', 'teacher');
  }

  // Seed default settings for KiosAPI
  const existingKios = db.prepare('SELECT key FROM settings WHERE key = ?').get('kiosapi_key');
  if (!existingKios) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('kiosapi_key', '');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('kiosapi_base_url', 'https://api.kiosapi.com/v1');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('kiosapi_model', 'deepseek-chat');
  }

  // Seed initial sample exam if empty
  const examCount = db.prepare('SELECT COUNT(*) as count FROM exams').get() as { count: number };
  if (examCount.count === 0) {
    seedSampleExam(db);
  }
}

function seedSampleExam(db: DatabaseSync) {
  const examId = 'exam_demo_2026';
  db.prepare(`
    INSERT INTO exams (id, teacher_id, title, subject, token, duration_minutes, passing_grade, show_score_immediately, show_review_immediately, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    examId,
    'user_guru_01',
    'Simulasi Ujian Matematika & Sains Terpadu',
    'Matematika & IPA',
    'CBT2026',
    45,
    75.0,
    1, // Score immediately visible
    1, // Review visible
    1
  );

  // Soal 1: Rumus KaTeX Aljabar
  const q1Id = 'q_demo_01';
  db.prepare(`
    INSERT INTO questions (id, exam_id, order_index, question_text, points, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    q1Id,
    examId,
    1,
    `Tentukan akar-akar penyelesaian dari persamaan kuadrat berikut:

$$2x^2 - 5x - 3 = 0$$

Gunakan rumus kuadratik $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ untuk membuktikan jawaban Anda.`,
    20.0,
    `Dengan $a=2, b=-5, c=-3$:
$$D = (-5)^2 - 4(2)(-3) = 25 + 24 = 49$$
$$x = \\frac{5 \\pm \\sqrt{49}}{2(2)} = \\frac{5 \\pm 7}{4}$$
Maka $x_1 = \\frac{12}{4} = 3$ dan $x_2 = \\frac{-2}{4} = -\\frac{1}{2}$. Jawaban yang benar adalah $x = 3$ atau $x = -\\frac{1}{2}$.`
  );

  const q1Options = [
    { key: 'A', text: '$x = 3$ atau $x = -\\frac{1}{2}$', isCorrect: 1 },
    { key: 'B', text: '$x = -3$ atau $x = \\frac{1}{2}$', isCorrect: 0 },
    { key: 'C', text: '$x = 2$ atau $x = -\\frac{3}{2}$', isCorrect: 0 },
    { key: 'D', text: '$x = 1$ atau $x = -3$', isCorrect: 0 },
    { key: 'E', text: '$x = 5$ atau $x = -2$', isCorrect: 0 },
  ];
  for (const opt of q1Options) {
    db.prepare('INSERT INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES (?, ?, ?, ?, ?)')
      .run(`${q1Id}_${opt.key}`, q1Id, opt.key, opt.text, opt.isCorrect);
  }

  // Soal 2: Tabel Percobaan Fisika
  const q2Id = 'q_demo_02';
  db.prepare(`
    INSERT INTO questions (id, exam_id, order_index, question_text, points, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    q2Id,
    examId,
    2,
    `Perhatikan tabel hasil pengukuran jarak tempuh terhadap waktu pada suatu benda yang bergerak lurus berubah beraturan (GLBB) berikut:

| Waktu ($t$, detik) | Kecepatan ($v$, m/s) | Jarak ($s$, meter) |
|---|---|---|
| 0 | 4 | 0 |
| 1 | 8 | 6 |
| 2 | 12 | 16 |
| 3 | 16 | 30 |
| 4 | 20 | 48 |

Berdasarkan data tabel di atas, berapakah besar percepatan ($a$) yang dialami benda tersebut?`,
    20.0,
    `Percepatan dihitung dari perubahan kecepatan tiap satuan waktu:
$$a = \\frac{\\Delta v}{\\Delta t} = \\frac{8 - 4}{1 - 0} = \\frac{12 - 8}{2 - 1} = 4\\text{ m/s}^2$$
Jadi percepatan benda konstan sebesar $4\\text{ m/s}^2$.`
  );

  const q2Options = [
    { key: 'A', text: '$2\\text{ m/s}^2$', isCorrect: 0 },
    { key: 'B', text: '$4\\text{ m/s}^2$', isCorrect: 1 },
    { key: 'C', text: '$6\\text{ m/s}^2$', isCorrect: 0 },
    { key: 'D', text: '$8\\text{ m/s}^2$', isCorrect: 0 },
    { key: 'E', text: '$12\\text{ m/s}^2$', isCorrect: 0 },
  ];
  for (const opt of q2Options) {
    db.prepare('INSERT INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES (?, ?, ?, ?, ?)')
      .run(`${q2Id}_${opt.key}`, q2Id, opt.key, opt.text, opt.isCorrect);
  }

  // Soal 3: Integral Kalkulus
  const q3Id = 'q_demo_03';
  db.prepare(`
    INSERT INTO questions (id, exam_id, order_index, question_text, points, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    q3Id,
    examId,
    3,
    `Hitunglah nilai dari integral tentu fungsi polinomial berikut:

$$\\int_0^3 (3x^2 - 4x + 2) \\, dx$$`,
    20.0,
    `Langkah integrasi:
$$\\int (3x^2 - 4x + 2) dx = [x^3 - 2x^2 + 2x]_0^3$$
Evaluasi batas atas $x=3$:
$$3^3 - 2(3)^2 + 2(3) = 27 - 18 + 6 = 15$$
Batas bawah $x=0$ bernilai $0$. Maka hasil akhirnya adalah $15$.`
  );

  const q3Options = [
    { key: 'A', text: '$12$', isCorrect: 0 },
    { key: 'B', text: '$15$', isCorrect: 1 },
    { key: 'C', text: '$18$', isCorrect: 0 },
    { key: 'D', text: '$21$', isCorrect: 0 },
    { key: 'E', text: '$27$', isCorrect: 0 },
  ];
  for (const opt of q3Options) {
    db.prepare('INSERT INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES (?, ?, ?, ?, ?)')
      .run(`${q3Id}_${opt.key}`, q3Id, opt.key, opt.text, opt.isCorrect);
  }

  // Soal 4: Reaksi Kimia & Stoikiometri
  const q4Id = 'q_demo_04';
  db.prepare(`
    INSERT INTO questions (id, exam_id, order_index, question_text, points, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    q4Id,
    examId,
    4,
    `Pada proses fotosintesis tumbuhan hijau, reaksi kimia yang terjadi adalah:

$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{klorofil, cahaya}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$

Jika dihasilkan $180\\text{ gram}$ glukosa ($\\text{C}_6\\text{H}_{12}\\text{O}_6$, $M_r = 180\\text{ g/mol}$), berapakah volume gas oksigen ($\\text{O}_2$) yang dibebaskan pada kondisi standar (STP, $22{,}4\\text{ L/mol}$)?`,
    20.0,
    `Mol glukosa = $\\frac{180}{180} = 1\\text{ mol}$.
Berdasarkan koefisien reaksi, mol $\\text{O}_2 = 6 \\times 1 = 6\\text{ mol}$.
Volume $\\text{O}_2$ pada STP = $6 \\times 22{,}4 = 134{,}4\\text{ Liter}$.`
  );

  const q4Options = [
    { key: 'A', text: '$22{,}4\\text{ L}$', isCorrect: 0 },
    { key: 'B', text: '$44{,}8\\text{ L}$', isCorrect: 0 },
    { key: 'C', text: '$67{,}2\\text{ L}$', isCorrect: 0 },
    { key: 'D', text: '$134{,}4\\text{ L}$', isCorrect: 1 },
    { key: 'E', text: '$224{,}0\\text{ L}$', isCorrect: 0 },
  ];
  for (const opt of q4Options) {
    db.prepare('INSERT INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES (?, ?, ?, ?, ?)')
      .run(`${q4Id}_${opt.key}`, q4Id, opt.key, opt.text, opt.isCorrect);
  }

  // Soal 5: Tabel Data Statistika
  const q5Id = 'q_demo_05';
  db.prepare(`
    INSERT INTO questions (id, exam_id, order_index, question_text, points, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    q5Id,
    examId,
    5,
    `Tabel di bawah menyajikan distribusi perolehan nilai kuis dari 20 siswa:

| Nilai Kuis | Frekuensi ($f$) |
|---|---|
| 60 | 3 |
| 70 | 5 |
| 80 | 7 |
| 90 | 4 |
| 100 | 1 |

Tentukan rata-rata (mean) dari data nilai kuis tersebut!`,
    20.0,
    `Jumlah nilai:
$$\\sum (f \\cdot x) = (3 \\times 60) + (5 \\times 70) + (7 \\times 80) + (4 \\times 90) + (1 \\times 100)$$
$$= 180 + 350 + 560 + 360 + 100 = 1550$$
Rata-rata:
$$\\bar{x} = \\frac{1550}{20} = 77{,}5$$`
  );

  const q5Options = [
    { key: 'A', text: '$75{,}0$', isCorrect: 0 },
    { key: 'B', text: '$76{,}5$', isCorrect: 0 },
    { key: 'C', text: '$77{,}5$', isCorrect: 1 },
    { key: 'D', text: '$80{,}0$', isCorrect: 0 },
    { key: 'E', text: '$82{,}5$', isCorrect: 0 },
  ];
  for (const opt of q5Options) {
    db.prepare('INSERT INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES (?, ?, ?, ?, ?)')
      .run(`${q5Id}_${opt.key}`, q5Id, opt.key, opt.text, opt.isCorrect);
  }
}
