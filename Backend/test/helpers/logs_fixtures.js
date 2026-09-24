/**
 * Helper cho test/test_api.py (phần ADMIN LOGS) — tạo / dọn dữ liệu thử của module admin-logs.
 * (Chưa có API nào để ghi error_logs, còn audit_logs chỉ được ghi khi admin thực hiện hành động,
 *  nên test tạo thẳng dữ liệu vào DB.)
 *
 * Log lỗi thử có created_at cố định vào năm 2001 để test lọc from/to không bị lẫn với log thật.
 *
 * Giao thức: đọc JSON từ stdin, in ra đúng 1 dòng JSON cuối cùng trên stdout.
 *
 *   echo "{}"                       | node test/helpers/logs_fixtures.js create
 *   echo '<JSON của lệnh create>'   | node test/helpers/logs_fixtures.js cleanup
 */
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env'), quiet: true });

const db = require('../../src/common/models');

const TAG = '[TEST-LOGS]';

async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

async function create() {
  const admin = await db.User.findOne({ where: { email: 'admin@engup.test' } });
  const student = await db.User.findOne({ where: { email: 'student1@engup.test' } });
  if (!admin || !student) throw new Error('Thiếu tài khoản admin/student1 — chạy "npm run db:seed" trước');

  const suffix = `${Date.now()}`;

  // 4 log lỗi: 2 backend + 2 ml-service, rải trong tháng 1/2001.
  const errorSpecs = [
    { service: 'backend', level: 'error', message: `${TAG} backend-1 ${suffix}`, created_at: new Date('2001-01-10T10:00:00Z') },
    { service: 'backend', level: 'critical', message: `${TAG} backend-2 ${suffix}`, created_at: new Date('2001-01-15T10:00:00Z') },
    { service: 'ml-service', level: 'warning', message: `${TAG} ml-1 ${suffix}`, created_at: new Date('2001-01-20T10:00:00Z') },
    {
      service: 'ml-service',
      level: 'info',
      message: `${TAG} ml-2 ${suffix}`,
      stack_trace: 'SECRET-STACK-TRACE',
      created_at: new Date('2001-01-25T10:00:00Z')
    }
  ];
  const errorIds = [];
  for (const spec of errorSpecs) {
    const row = await db.ErrorLog.create(spec);
    errorIds.push(row.id);
  }

  // 3 audit log: admin làm 2 (target 1001 rồi 1002), student1 làm 1 — cùng loại action "alpha".
  const actionAlpha = `test.logs.alpha.${suffix}`;
  const actionBeta = `test.logs.beta.${suffix}`;
  const auditSpecs = [
    { actor_id: admin.id, action: actionAlpha, target_type: 'test_logs', target_id: 1001, detail: { secret: true } },
    { actor_id: admin.id, action: actionAlpha, target_type: 'test_logs', target_id: 1002, detail: { secret: true } },
    { actor_id: student.id, action: actionBeta, target_type: 'test_logs', target_id: 1003, detail: { secret: true } }
  ];
  const auditIds = [];
  for (const spec of auditSpecs) {
    const row = await db.AuditLog.create(spec);
    auditIds.push(row.id);
  }

  return {
    error_ids: errorIds,
    audit_ids: auditIds,
    admin_id: Number(admin.id),
    student_id: Number(student.id),
    tag: TAG,
    suffix,
    action_alpha: actionAlpha,
    action_beta: actionBeta
  };
}

async function cleanup(fixture) {
  await db.ErrorLog.destroy({ where: { id: fixture.error_ids || [] } });
  await db.AuditLog.destroy({ where: { id: fixture.audit_ids || [] } });
  return { cleaned: true };
}

(async () => {
  const mode = process.argv[2];
  let exitCode = 0;
  try {
    const input = await readStdinJson();
    let output;
    if (mode === 'create') output = await create();
    else if (mode === 'cleanup') output = await cleanup(input);
    else throw new Error(`Mode không hợp lệ: ${mode} (create | cleanup)`);

    process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (err) {
    process.stdout.write(`${JSON.stringify({ error: err.message })}\n`);
    exitCode = 1;
  } finally {
    await db.sequelize.close();
    process.exitCode = exitCode;
  }
})();
