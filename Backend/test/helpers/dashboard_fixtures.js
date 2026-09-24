/**
 * Helper cho test/test_api.py (phần 12-14: ADMIN NOTIFICATIONS / DASHBOARD / SUBSCRIPTIONS).
 * Tạo / đối chiếu / dọn dữ liệu thử của module admin-dashboard trực tiếp trong DB, vì chưa có API để
 * ghi notifications, subscriptions, user_test_attempts...
 *
 * Thông báo thử có created_at cố định vào năm 2001 để test lọc from/to không lẫn với dữ liệu thật.
 *
 * Giao thức: đọc JSON từ stdin, in ra đúng 1 dòng JSON cuối cùng trên stdout.
 *
 *   echo "{}"                       | node test/helpers/dashboard_fixtures.js create
 *   echo "{}"                       | node test/helpers/dashboard_fixtures.js expected
 *   echo '<JSON của lệnh create>'   | node test/helpers/dashboard_fixtures.js cleanup
 */
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env'), quiet: true });

const { Op, QueryTypes } = require('sequelize');
const db = require('../../src/common/models');

const TAG = '[TEST-DASH]';

async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

async function create() {
  const student1 = await db.User.findOne({ where: { email: 'student1@engup.test' } });
  if (!student1) throw new Error('Thiếu tài khoản student1 — chạy "npm run db:seed" trước');

  const suffix = `${Date.now()}`;
  const user = await db.User.create({
    email: `test.dashboard.${suffix}@engup.test`,
    password_hash: 'not-a-real-hash',
    full_name: `${TAG} User`,
    role: 'student'
  });

  // 3 thông báo đã gửi cho user thử, rải trong tháng 1/2001.
  const notificationIds = [];
  const dates = ['2001-01-10T10:00:00Z', '2001-01-15T10:00:00Z', '2001-01-20T10:00:00Z'];
  for (let i = 0; i < dates.length; i += 1) {
    const n = await db.Notification.create({
      user_id: user.id,
      title: `${TAG} notification-${i + 1} ${suffix}`,
      body: 'Fixture body',
      type: 'test_dashboard',
      is_read: i === 0,
      created_at: new Date(dates[i])
    });
    notificationIds.push(n.id);
  }

  // Gói cước + 2 đăng ký (user thử: active; student1: expired).
  const plan = await db.SubscriptionPlan.create({
    name: `${TAG} Plan ${suffix}`,
    price: 99000,
    duration_days: 30,
    features: ['fixture']
  });
  const subActive = await db.Subscription.create({
    user_id: user.id, plan_id: plan.id, status: 'active', start_date: '2026-09-01', end_date: '2026-10-01'
  });
  const subExpired = await db.Subscription.create({
    user_id: student1.id, plan_id: plan.id, status: 'expired', start_date: '2026-01-01', end_date: '2026-01-31'
  });

  // Lượt làm bài: 4 lượt, 2 đã nộp.
  const testSet = await db.TestSet.create({
    exam_type: 'TOEIC', section: 'Reading', title: `${TAG} Test set ${suffix}`, time_limit_minutes: 10
  });
  const now = new Date();
  const attemptIds = [];
  for (const status of ['submitted', 'submitted', 'in_progress', 'in_progress']) {
    const a = await db.UserTestAttempt.create({
      user_id: user.id,
      test_set_id: testSet.id,
      status,
      score: status === 'submitted' ? 80 : null,
      band_score: status === 'submitted' ? 7.0 : null,
      started_at: now,
      submitted_at: status === 'submitted' ? now : null
    });
    attemptIds.push(a.id);
  }

  // Hoạt động hôm nay: user thử nộp 1 bài đọc -> daily_active_users tăng đúng 1.
  const article = await db.ReadingArticle.create({
    title: `${TAG} Article ${suffix}`,
    content: 'Fixture article for the dashboard test.',
    difficulty: 'B1',
    topic: 'Test',
    is_ai_generated: false,
    is_approved: true,
    created_by: null
  });
  const readingAttempt = await db.ReadingAttempt.create({
    user_id: user.id,
    article_id: article.id,
    answers: [],
    score: 100,
    correct_count: 1,
    total_count: 1,
    submitted_at: now
  });

  // Log lỗi gần đây: 1 critical (phải xuất hiện đầu danh sách) + 1 info (không được xuất hiện).
  const errCritical = await db.ErrorLog.create({
    service: 'backend', level: 'critical', message: `${TAG} critical ${suffix}`, stack_trace: 'SECRET-STACK'
  });
  const errInfo = await db.ErrorLog.create({ service: 'ml-service', level: 'info', message: `${TAG} info ${suffix}` });

  return {
    tag: TAG,
    suffix,
    user_id: Number(user.id),
    student1_id: Number(student1.id),
    notification_ids: notificationIds,
    plan_id: Number(plan.id),
    plan_name: plan.name,
    subscription_ids: [subActive.id, subExpired.id],
    test_set_id: testSet.id,
    attempt_ids: attemptIds,
    article_id: article.id,
    reading_attempt_id: readingAttempt.id,
    error_ids: [errCritical.id, errInfo.id],
    critical_message: errCritical.message,
    info_message: errInfo.message
  };
}

// Số liệu dashboard tính lại bằng SQL thuần — đối chứng độc lập với code của module.
async function expected() {
  const one = async (sql, replacements = {}) => {
    const [row] = await db.sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    return Number(Object.values(row)[0]);
  };

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const range = { start, end };

  const totalUsers = await one('SELECT COUNT(*) AS c FROM users');
  const dau = await one(
    `SELECT COUNT(*) AS c FROM (
       SELECT user_id FROM review_logs WHERE reviewed_at >= :start AND reviewed_at < :end
       UNION SELECT user_id FROM reading_attempts WHERE submitted_at >= :start AND submitted_at < :end
       UNION SELECT user_id FROM listening_dictation_attempts WHERE submitted_at >= :start AND submitted_at < :end
     ) t`,
    range
  );
  const attempts = await one('SELECT COUNT(*) AS c FROM user_test_attempts');
  const submitted = await one("SELECT COUNT(*) AS c FROM user_test_attempts WHERE status = 'submitted'");

  return {
    total_users: totalUsers,
    daily_active_users: dau,
    completion_rate: attempts > 0 ? Number(((submitted / attempts) * 100).toFixed(2)) : 0
  };
}

// Dọn toàn bộ dữ liệu thử, kể cả mẫu thông báo / gói cước do test tạo qua API (tên bắt đầu bằng TAG).
async function cleanup(fixture) {
  const like = { [Op.like]: `${TAG}%` };

  const templates = await db.NotificationTemplate.findAll({ where: { name: like }, attributes: ['id'], raw: true });
  const plans = await db.SubscriptionPlan.findAll({ where: { name: like }, attributes: ['id'], raw: true });
  const templateIds = templates.map((t) => t.id);
  const planIds = plans.map((p) => p.id);

  // Mẫu/gói do test tạo rồi xoá bằng API không còn trong DB, nhưng audit log của chúng vẫn còn:
  // test gửi kèm id để dọn (chỉ dọn đúng các id này, không đụng tới audit log thật).
  const auditTemplateIds = [...new Set([...templateIds, ...(fixture.template_ids || [])])];
  const auditPlanIds = [...new Set([...planIds, ...(fixture.plan_ids || [])])];
  await db.AuditLog.destroy({ where: { target_type: 'notification_template', target_id: auditTemplateIds } });
  await db.AuditLog.destroy({ where: { target_type: 'subscription_plan', target_id: auditPlanIds } });

  await db.Notification.destroy({ where: { title: like } });
  await db.NotificationTemplate.destroy({ where: { id: templateIds } });
  await db.Subscription.destroy({ where: { plan_id: planIds } });
  await db.SubscriptionPlan.destroy({ where: { id: planIds } });

  await db.UserTestAttempt.destroy({ where: { id: fixture.attempt_ids || [] } });
  await db.TestSet.destroy({ where: { title: like } });
  await db.ReadingAttempt.destroy({ where: { id: fixture.reading_attempt_id || 0 } });
  await db.ReadingArticle.destroy({ where: { title: like } });
  await db.ErrorLog.destroy({ where: { message: like } });
  await db.User.destroy({ where: { full_name: like } });
  return { cleaned: true };
}

(async () => {
  const mode = process.argv[2];
  let exitCode = 0;
  try {
    const input = await readStdinJson();
    let output;
    if (mode === 'create') output = await create();
    else if (mode === 'expected') output = await expected();
    else if (mode === 'cleanup') output = await cleanup(input);
    else throw new Error(`Mode không hợp lệ: ${mode} (create | expected | cleanup)`);

    process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (err) {
    process.stdout.write(`${JSON.stringify({ error: err.message })}\n`);
    exitCode = 1;
  } finally {
    await db.sequelize.close();
    process.exitCode = exitCode;
  }
})();
