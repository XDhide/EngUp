/**
 * Helper cho test/test_api.py (phần ADMIN TESTS) — thao tác trực tiếp DB vì chưa có API
 * (test-practice chưa được mount) để tạo lượt làm bài của học viên.
 *
 * Giao thức: đọc JSON từ stdin, in ra đúng 1 dòng JSON cuối cùng trên stdout.
 *
 *   echo '{"test_set_id":5}'                           | node test/helpers/admin_tests_fixtures.js seed_attempts
 *   echo '{"test_set_id":5}'                           | node test/helpers/admin_tests_fixtures.js delete_attempts
 *   echo '{"test_set_id":5,"question_ids":[1,2]}'      | node test/helpers/admin_tests_fixtures.js cleanup
 */
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env'), quiet: true });

const db = require('../../src/common/models');

async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

// 3 lượt làm cho 2 học viên seed: 2 đã nộp (80 / 60 điểm) + 1 đang làm dở -> completion_rate = 66.67
async function seedAttempts({ test_set_id: testSetId }) {
  const s1 = await db.User.findOne({ where: { email: 'student1@engup.test' } });
  const s2 = await db.User.findOne({ where: { email: 'student2@engup.test' } });
  if (!s1 || !s2) throw new Error('Thiếu tài khoản student1/student2 — chạy "npm run db:seed" trước');

  const now = new Date();
  const rows = [
    { user_id: s1.id, test_set_id: testSetId, status: 'submitted', score: 80, band_score: 7.0, started_at: now, submitted_at: now },
    { user_id: s2.id, test_set_id: testSetId, status: 'submitted', score: 60, band_score: 5.5, started_at: now, submitted_at: now },
    { user_id: s1.id, test_set_id: testSetId, status: 'in_progress', score: null, band_score: null, started_at: now, submitted_at: null }
  ];
  await db.UserTestAttempt.bulkCreate(rows);

  return { user_ids: { student1: s1.id, student2: s2.id } };
}

async function deleteAttempts({ test_set_id: testSetId }) {
  const count = await db.UserTestAttempt.destroy({ where: { test_set_id: testSetId } });
  return { deleted: count };
}

// Dọn toàn bộ dữ liệu thử (an toàn khi gọi nhiều lần / khi đề đã bị xoá).
async function cleanup({ test_set_id: testSetId, question_ids: questionIds = [] }) {
  if (testSetId) await db.UserTestAttempt.destroy({ where: { test_set_id: testSetId } });
  if (questionIds.length) await db.TestQuestion.destroy({ where: { id: questionIds } });
  if (testSetId) await db.TestSet.destroy({ where: { id: testSetId } }); // câu hỏi còn lại xoá theo (CASCADE)

  if (testSetId) await db.AuditLog.destroy({ where: { target_type: 'test_set', target_id: testSetId } });
  if (questionIds.length) await db.AuditLog.destroy({ where: { target_type: 'test_question', target_id: questionIds } });
  return { cleaned: true };
}

(async () => {
  const mode = process.argv[2];
  let exitCode = 0;
  try {
    const input = await readStdinJson();
    let output;
    if (mode === 'seed_attempts') output = await seedAttempts(input);
    else if (mode === 'delete_attempts') output = await deleteAttempts(input);
    else if (mode === 'cleanup') output = await cleanup(input);
    else throw new Error(`Mode không hợp lệ: ${mode} (seed_attempts | delete_attempts | cleanup)`);

    process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (err) {
    process.stdout.write(`${JSON.stringify({ error: err.message })}\n`);
    exitCode = 1;
  } finally {
    await db.sequelize.close();
    process.exitCode = exitCode;
  }
})();
