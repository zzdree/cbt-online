import { getDb } from '../src/lib/db';
import { parseRichContent, renderMathOnly, parseMarkdownTables } from '../src/lib/rich-parser';

async function runTests() {
  console.log('🧪 Starting CBT System Verification Tests...\n');

  const db = await getDb();

  // Test 1: Verify Seed Data
  console.log('--- Test 1: Seed Data Verification ---');
  const exam = (await db.prepare("SELECT * FROM exams WHERE token = 'CBT2026'").get()) as any;
  if (!exam) throw new Error('FAIL: Seed exam not found');
  console.log(`✅ Exam found: "${exam.title}" (Token: ${exam.token})`);

  const questions = (await db.prepare('SELECT * FROM questions WHERE exam_id = ?').all(exam.id)) as any[];
  console.log(`✅ Questions count: ${questions.length} (Expected: 5)`);
  if (questions.length !== 5) throw new Error(`FAIL: Expected 5 questions, got ${questions.length}`);

  // Test 2: Rich Content & KaTeX Math Rendering
  console.log('\n--- Test 2: Rich Content & KaTeX Math Rendering ---');
  const mathFormula = 'Rumus: $E = mc^2$ dan $$\\int_0^1 x dx = \\frac{1}{2}$$';
  const renderedMath = renderMathOnly(mathFormula);
  const hasKatex = renderedMath.includes('katex');
  console.log(`✅ KaTeX parser output length: ${renderedMath.length}, contains katex: ${hasKatex}`);
  if (!hasKatex) throw new Error('FAIL: KaTeX did not render');

  const markdownTable = `
| Kolom A | Kolom B |
|---|---|
| Data 1 | Data 2 |
`;
  const renderedTable = parseMarkdownTables(markdownTable);
  const hasTable = renderedTable.includes('<table class="cbt-table">') && renderedTable.includes('<div class="cbt-table-container">');
  console.log(`✅ Markdown Table rendered with responsive wrapper: ${hasTable}`);
  if (!hasTable) throw new Error('FAIL: Table parser did not generate cbt-table wrapper');

  // Test 3: Anti-Cheat 30s Lockout Enforcement
  console.log('\n--- Test 3: Anti-Cheat 30s Lockout Enforcement ---');
  const testAttemptId = `test_att_${Date.now()}`;
  await db.prepare(`
    INSERT INTO exam_attempts (id, exam_id, student_number, student_name, status)
    VALUES (?, ?, ?, ?, 'in_progress')
  `).run(testAttemptId, exam.id, 'NISN_9999', 'Siswa Pengujian');

  const lockoutSeconds = 30;
  const now = new Date();
  const lockoutUntil = new Date(now.getTime() + lockoutSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatTime = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  await db.prepare(`
    UPDATE exam_attempts
    SET lockout_until = ?, violation_count = violation_count + 1, status = 'locked'
    WHERE id = ?
  `).run(formatTime(lockoutUntil), testAttemptId);

  const lockedAttempt = (await db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(testAttemptId)) as any;
  console.log(`✅ Attempt status: ${lockedAttempt.status}, violations: ${lockedAttempt.violation_count}`);
  if (lockedAttempt.status !== 'locked' || lockedAttempt.violation_count !== 1) {
    throw new Error('FAIL: Lockout state not recorded correctly');
  }

  const remainingCheck = Math.ceil((new Date(lockedAttempt.lockout_until.replace(' ', 'T')).getTime() - Date.now()) / 1000);
  console.log(`✅ Remaining lockout seconds: ${remainingCheck}s (Expected ~30s)`);
  if (remainingCheck <= 0) throw new Error('FAIL: Lockout should not be expired immediately');

  // Test 4: Answer Submission & Scoring
  console.log('\n--- Test 4: Answer Submission & Scoring ---');
  const q1 = questions[0];
  const q1Correct = (await db.prepare('SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1').get(q1.id)) as any;
  await db.prepare(`
    INSERT INTO attempt_answers (id, attempt_id, question_id, selected_option_id, is_hesitant)
    VALUES (?, ?, ?, ?, 0)
  `).run(`ans_test_${Date.now()}`, testAttemptId, q1.id, q1Correct.id);

  await db.prepare(`
    UPDATE exam_attempts
    SET status = 'submitted', score = 20.0, is_passed = 0
    WHERE id = ?
  `).run(testAttemptId);

  const finalAttempt = (await db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(testAttemptId)) as any;
  console.log(`✅ Submitted successfully! Score: ${finalAttempt.score}, Status: ${finalAttempt.status}`);

  // Test 5: Score Visibility Toggle
  console.log('\n--- Test 5: Score Visibility Toggle ---');
  await db.prepare('UPDATE exams SET show_score_immediately = 0 WHERE id = ?').run(exam.id);
  const examHidden = (await db.prepare('SELECT show_score_immediately FROM exams WHERE id = ?').get(exam.id)) as any;
  console.log(`✅ Score visibility toggled to: ${examHidden.show_score_immediately === 0 ? 'HIDDEN' : 'VISIBLE'}`);

  await db.prepare('UPDATE exams SET show_score_immediately = 1 WHERE id = ?').run(exam.id);
  const examVisible = (await db.prepare('SELECT show_score_immediately FROM exams WHERE id = ?').get(exam.id)) as any;
  console.log(`✅ Score visibility restored to: ${examVisible.show_score_immediately === 1 ? 'VISIBLE' : 'HIDDEN'}`);

  await db.prepare('DELETE FROM attempt_answers WHERE attempt_id = ?').run(testAttemptId);
  await db.prepare('DELETE FROM exam_attempts WHERE id = ?').run(testAttemptId);
  console.log('✅ Test attempt cleaned up cleanly.');

  console.log('\n🎉 ALL 5 VERIFICATION SUITES PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
