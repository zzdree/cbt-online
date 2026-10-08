-- ============================================================================
-- CBT ONLINE - CLOUDFLARE D1 (SQLITE) SEED DATA
-- ============================================================================

-- 1. Seed Teacher
INSERT OR IGNORE INTO users (id, username, password_hash, name, role)
-- Akun awal sementara, WAJIB ganti username/password saat instalasi paling lambat
-- pada sesi administrasi pertama. Lihat bagian "Instalasi Pemakaian Nyata" pada README.
VALUES ('user_admin_awal', 'admin', 'ganti_password_sebelum_dipakai', 'Administrator Sekolah', 'admin');

-- 2. Seed Settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('kiosapi_key', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('kiosapi_base_url', 'https://api.kiosapi.com/v1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('kiosapi_model', 'deepseek-chat');

-- 3. Seed Demo Exam
INSERT OR IGNORE INTO exams (id, teacher_id, title, subject, token, duration_minutes, passing_grade, show_score_immediately, show_review_immediately, is_active)
VALUES ('exam_demo_2026', 'user_guru_01', 'Simulasi Ujian Matematika & Sains Terpadu', 'Matematika & IPA', 'CBT2026', 45, 75.0, 1, 1, 1);

-- 4. Seed Questions
-- Question 1: KaTeX Algebra
INSERT OR IGNORE INTO questions (id, exam_id, order_index, question_text, points, explanation)
VALUES (
  'q_demo_01',
  'exam_demo_2026',
  1,
  'Tentukan akar-akar penyelesaian dari persamaan kuadrat berikut:

$$2x^2 - 5x - 3 = 0$$

Gunakan rumus kuadratik $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ untuk membuktikan jawaban Anda.',
  20.0,
  'Dengan $a=2, b=-5, c=-3$:
$$D = (-5)^2 - 4(2)(-3) = 25 + 24 = 49$$
$$x = \frac{5 \pm \sqrt{49}}{2(2)} = \frac{5 \pm 7}{4}$$
Maka $x_1 = \frac{12}{4} = 3$ dan $x_2 = \frac{-2}{4} = -\frac{1}{2}$. Jawaban yang benar adalah $x = 3$ atau $x = -\frac{1}{2}$.'
);

INSERT OR IGNORE INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES
  ('q_demo_01_A', 'q_demo_01', 'A', '$x = 3$ atau $x = -\frac{1}{2}$', 1),
  ('q_demo_01_B', 'q_demo_01', 'B', '$x = -3$ atau $x = \frac{1}{2}$', 0),
  ('q_demo_01_C', 'q_demo_01', 'C', '$x = 2$ atau $x = -\frac{3}{2}$', 0),
  ('q_demo_01_D', 'q_demo_01', 'D', '$x = 1$ atau $x = -3$', 0),
  ('q_demo_01_E', 'q_demo_01', 'E', '$x = 5$ atau $x = -2$', 0);

-- Question 2: Physics GLBB Table
INSERT OR IGNORE INTO questions (id, exam_id, order_index, question_text, points, explanation)
VALUES (
  'q_demo_02',
  'exam_demo_2026',
  2,
  'Perhatikan tabel hasil pengukuran jarak tempuh terhadap waktu pada suatu benda yang bergerak lurus berubah beraturan (GLBB) berikut:

| Waktu ($t$, detik) | Kecepatan ($v$, m/s) | Jarak ($s$, meter) |
|---|---|---|
| 0 | 4 | 0 |
| 1 | 8 | 6 |
| 2 | 12 | 16 |
| 3 | 16 | 30 |
| 4 | 20 | 48 |

Berdasarkan data tabel di atas, berapakah besar percepatan ($a$) yang dialami benda tersebut?',
  20.0,
  'Percepatan dihitung dari perubahan kecepatan tiap satuan waktu:
$$a = \frac{\Delta v}{\Delta t} = \frac{8 - 4}{1 - 0} = 4\text{ m/s}^2$$
Jadi percepatan benda konstan sebesar $4\text{ m/s}^2$.'
);

INSERT OR IGNORE INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES
  ('q_demo_02_A', 'q_demo_02', 'A', '$2\text{ m/s}^2$', 0),
  ('q_demo_02_B', 'q_demo_02', 'B', '$4\text{ m/s}^2$', 1),
  ('q_demo_02_C', 'q_demo_02', 'C', '$6\text{ m/s}^2$', 0),
  ('q_demo_02_D', 'q_demo_02', 'D', '$8\text{ m/s}^2$', 0),
  ('q_demo_02_E', 'q_demo_02', 'E', '$12\text{ m/s}^2$', 0);

-- Question 3: Calculus
INSERT OR IGNORE INTO questions (id, exam_id, order_index, question_text, points, explanation)
VALUES (
  'q_demo_03',
  'exam_demo_2026',
  3,
  'Hitunglah nilai dari integral tentu fungsi polinomial berikut:

$$\int_0^3 (3x^2 - 4x + 2) \, dx$$',
  20.0,
  'Langkah integrasi:
$$\int (3x^2 - 4x + 2) dx = [x^3 - 2x^2 + 2x]_0^3$$
Evaluasi batas atas $x=3$:
$$3^3 - 2(3)^2 + 2(3) = 27 - 18 + 6 = 15$$
Batas bawah $x=0$ bernilai $0$. Maka hasil akhirnya adalah $15$.'
);

INSERT OR IGNORE INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES
  ('q_demo_03_A', 'q_demo_03', 'A', '$12$', 0),
  ('q_demo_03_B', 'q_demo_03', 'B', '$15$', 1),
  ('q_demo_03_C', 'q_demo_03', 'C', '$18$', 0),
  ('q_demo_03_D', 'q_demo_03', 'D', '$21$', 0),
  ('q_demo_03_E', 'q_demo_03', 'E', '$27$', 0);

-- Question 4: Chemistry Stoichiometry
INSERT OR IGNORE INTO questions (id, exam_id, order_index, question_text, points, explanation)
VALUES (
  'q_demo_04',
  'exam_demo_2026',
  4,
  'Pada proses fotosintesis tumbuhan hijau, reaksi kimia yang terjadi adalah:

$$6\text{CO}_2 + 6\text{H}_2\text{O} \xrightarrow{\text{klorofil, cahaya}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2$$

Jika dihasilkan $180\text{ gram}$ glukosa ($\text{C}_6\text{H}_{12}\text{O}_6$, $M_r = 180\text{ g/mol}$), berapakah volume gas oksigen ($\text{O}_2$) yang dibebaskan pada kondisi standar (STP, $22{,}4\text{ L/mol}$)?',
  20.0,
  'Mol glukosa = $\frac{180}{180} = 1\text{ mol}$.
Berdasarkan koefisien reaksi, mol $\text{O}_2 = 6 \times 1 = 6\text{ mol}$.
Volume $\text{O}_2$ pada STP = $6 \times 22{,}4 = 134{,}4\text{ Liter}$.'
);

INSERT OR IGNORE INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES
  ('q_demo_04_A', 'q_demo_04', 'A', '$22{,}4\text{ L}$', 0),
  ('q_demo_04_B', 'q_demo_04', 'B', '$44{,}8\text{ L}$', 0),
  ('q_demo_04_C', 'q_demo_04', 'C', '$67{,}2\text{ L}$', 0),
  ('q_demo_04_D', 'q_demo_04', 'D', '$134{,}4\text{ L}$', 1),
  ('q_demo_04_E', 'q_demo_04', 'E', '$224{,}0\text{ L}$', 0);

-- Question 5: Statistics
INSERT OR IGNORE INTO questions (id, exam_id, order_index, question_text, points, explanation)
VALUES (
  'q_demo_05',
  'exam_demo_2026',
  5,
  'Tabel di bawah menyajikan distribusi perolehan nilai kuis dari 20 siswa:

| Nilai Kuis | Frekuensi ($f$) |
|---|---|
| 60 | 3 |
| 70 | 5 |
| 80 | 7 |
| 90 | 4 |
| 100 | 1 |

Tentukan rata-rata (mean) dari data nilai kuis tersebut!',
  20.0,
  'Jumlah nilai:
$$\sum (f \cdot x) = (3 \times 60) + (5 \times 70) + (7 \times 80) + (4 \times 90) + (1 \times 100) = 1550$$
Rata-rata:
$$\bar{x} = \frac{1550}{20} = 77{,}5$$'
);

INSERT OR IGNORE INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES
  ('q_demo_05_A', 'q_demo_05', 'A', '$75{,}0$', 0),
  ('q_demo_05_B', 'q_demo_05', 'B', '$76{,}5$', 0),
  ('q_demo_05_C', 'q_demo_05', 'C', '$77{,}5$', 1),
  ('q_demo_05_D', 'q_demo_05', 'D', '$80{,}0$', 0),
  ('q_demo_05_E', 'q_demo_05', 'E', '$82{,}5$', 0);
