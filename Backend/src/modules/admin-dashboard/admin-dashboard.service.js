const adminDashboardRepository = require('./admin-dashboard.Repository');
const AppError = require('../../common/utils/AppError');
const {
  toTemplateDto,
  toSentNotificationDto,
  toRecentErrorDto,
  toPlanDto,
  toSubscriptionDto
} = require('./admin-dashboard.dtos');

const TEMPLATE_FIELDS = ['name', 'title_template', 'body_template', 'type'];
const PLAN_FIELDS = ['name', 'price', 'duration_days', 'features'];

// Giới hạn cứng số dòng trả về để bảng lớn không làm treo API / trình duyệt.
const MAX_LIST_ROWS = 500;
const RECENT_ERRORS_LIMIT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  }
}

// Chỉ lấy các field được phép (chống mass-assignment: không cho client ghi id, created_at...).
function pick(source, fields) {
  const result = {};
  fields.forEach((field) => {
    if (source && source[field] !== undefined) result[field] = source[field];
  });
  return result;
}

// Các field có giá trị thực sự thay đổi so với bản ghi hiện tại -> ghi vào audit log.
function diffFields(current, patch, normalize = (v) => v) {
  const changes = {};
  Object.keys(patch).forEach((field) => {
    const before = normalize(current[field], field);
    if (JSON.stringify(before) !== JSON.stringify(patch[field])) {
      changes[field] = { from: before ?? null, to: patch[field] };
    }
  });
  return changes;
}

// price là DECIMAL -> MySQL trả chuỗi; so sánh dưới dạng số.
const normalizePlanValue = (value, field) => (field === 'price' ? Number(value) : value);

// ====================================================================
// Mẫu thông báo
// ====================================================================

async function getTemplateOrThrow(id, transaction) {
  const template = await adminDashboardRepository.findTemplateById(id, transaction);
  if (!template) throw new AppError('Mẫu thông báo không tồn tại', 404);
  return template;
}

async function assertTemplateNameAvailable(name, exceptId, transaction) {
  const existing = await adminDashboardRepository.findTemplateByName(name, transaction);
  if (existing && Number(existing.id) !== Number(exceptId)) {
    throw new AppError('Tên mẫu thông báo đã tồn tại', 409);
  }
}

async function createTemplate(requester, payload) {
  assertAdmin(requester);
  const data = pick(payload, TEMPLATE_FIELDS);

  return adminDashboardRepository.withTransaction(async (transaction) => {
    await assertTemplateNameAvailable(data.name, null, transaction);
    const template = await adminDashboardRepository.createTemplate(data, transaction);

    await adminDashboardRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'notification_template.create',
        target_type: 'notification_template',
        target_id: template.id,
        detail: { name: template.name, type: template.type }
      },
      transaction
    );

    return toTemplateDto(template);
  });
}

async function updateTemplate(requester, templateId, payload) {
  assertAdmin(requester);
  const patch = pick(payload, TEMPLATE_FIELDS);

  return adminDashboardRepository.withTransaction(async (transaction) => {
    const template = await getTemplateOrThrow(templateId, transaction);
    if (patch.name !== undefined && patch.name !== template.name) {
      await assertTemplateNameAvailable(patch.name, template.id, transaction);
    }

    const changes = diffFields(template, patch);
    const updated = await adminDashboardRepository.updateTemplate(template, patch, transaction);

    await adminDashboardRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'notification_template.update',
        target_type: 'notification_template',
        target_id: template.id,
        detail: { changes }
      },
      transaction
    );

    return toTemplateDto(updated);
  });
}

async function deleteTemplate(requester, templateId) {
  assertAdmin(requester);

  return adminDashboardRepository.withTransaction(async (transaction) => {
    const template = await getTemplateOrThrow(templateId, transaction);
    const snapshot = toTemplateDto(template); // chụp lại trước khi xoá để trả về

    await adminDashboardRepository.destroyTemplate(template, transaction);

    await adminDashboardRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'notification_template.delete',
        target_type: 'notification_template',
        target_id: snapshot.id,
        detail: { name: snapshot.name, type: snapshot.type }
      },
      transaction
    );

    return snapshot;
  });
}

// filters đã được validation chuẩn hoá: { from?: Date, to?: Date }
async function getSentHistory(requester, { from, to } = {}) {
  assertAdmin(requester);

  const rows = await adminDashboardRepository.findSentNotifications({ from, to, limit: MAX_LIST_ROWS });
  return { history: rows.map(toSentNotificationDto) };
}

// ====================================================================
// Dashboard tổng quan (read-only)
// ====================================================================

// Ngày hiện tại theo UTC (cùng quy ước với streak job): [00:00, 24:00).
function utcDayBounds(now) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from: start, to: new Date(start.getTime() + DAY_MS) };
}

async function getOverview(requester, { now = new Date() } = {}) {
  assertAdmin(requester);

  const [totalUsers, activeUserIds, attempts, recentErrors] = await Promise.all([
    adminDashboardRepository.countUsers(),
    adminDashboardRepository.findActiveUserIds(utcDayBounds(now)),
    adminDashboardRepository.countTestAttempts(),
    adminDashboardRepository.findRecentErrors(RECENT_ERRORS_LIMIT)
  ]);

  // completion_rate: % lượt làm bài thi đã nộp trên toàn hệ thống (0..100, làm tròn 2 chữ số);
  // chưa có lượt nào -> 0 (cùng định nghĩa với admin-tests).
  const completionRate =
    attempts.total > 0 ? Number(((attempts.submitted / attempts.total) * 100).toFixed(2)) : 0;

  return {
    total_users: totalUsers,
    daily_active_users: new Set(activeUserIds.map(Number)).size,
    completion_rate: completionRate,
    recent_errors: recentErrors.map(toRecentErrorDto)
  };
}

// ====================================================================
// Gói cước & đăng ký gói
// ====================================================================

async function getPlanOrThrow(id, transaction) {
  const plan = await adminDashboardRepository.findPlanById(id, transaction);
  if (!plan) throw new AppError('Gói cước không tồn tại', 404);
  return plan;
}

async function createPlan(requester, payload) {
  assertAdmin(requester);
  const data = pick(payload, PLAN_FIELDS);
  if (data.features === undefined) data.features = null;

  return adminDashboardRepository.withTransaction(async (transaction) => {
    const plan = await adminDashboardRepository.createPlan(data, transaction);

    await adminDashboardRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'subscription_plan.create',
        target_type: 'subscription_plan',
        target_id: plan.id,
        detail: { name: data.name, price: data.price, duration_days: data.duration_days }
      },
      transaction
    );

    return toPlanDto(plan);
  });
}

async function updatePlan(requester, planId, payload) {
  assertAdmin(requester);
  const patch = pick(payload, PLAN_FIELDS);

  return adminDashboardRepository.withTransaction(async (transaction) => {
    const plan = await getPlanOrThrow(planId, transaction);

    const changes = diffFields(plan, patch, normalizePlanValue);
    const updated = await adminDashboardRepository.updatePlan(plan, patch, transaction);

    await adminDashboardRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'subscription_plan.update',
        target_type: 'subscription_plan',
        target_id: plan.id,
        detail: { changes }
      },
      transaction
    );

    return toPlanDto(updated);
  });
}

async function deletePlan(requester, planId) {
  assertAdmin(requester);

  return adminDashboardRepository.withTransaction(async (transaction) => {
    const plan = await getPlanOrThrow(planId, transaction);

    // Xoá gói sẽ kéo theo xoá (CASCADE) toàn bộ đăng ký của người dùng -> không cho phép.
    const subscriptionCount = await adminDashboardRepository.countSubscriptionsOfPlan(plan.id, transaction);
    if (subscriptionCount > 0) {
      throw new AppError(`Gói cước đã có ${subscriptionCount} lượt đăng ký nên không thể xoá`, 409);
    }

    const snapshot = toPlanDto(plan); // chụp lại trước khi xoá để trả về

    await adminDashboardRepository.destroyPlan(plan, transaction);

    await adminDashboardRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'subscription_plan.delete',
        target_type: 'subscription_plan',
        target_id: snapshot.id,
        detail: { name: snapshot.name }
      },
      transaction
    );

    return snapshot;
  });
}

// filters đã được validation chuẩn hoá: { user_id?: number, status? }
async function getSubscriptions(requester, { user_id, status } = {}) {
  assertAdmin(requester);

  const rows = await adminDashboardRepository.findSubscriptions({ user_id, status, limit: MAX_LIST_ROWS });
  return { subscriptions: rows.map(toSubscriptionDto) };
}

module.exports = {
  MAX_LIST_ROWS,
  RECENT_ERRORS_LIMIT,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSentHistory,
  getOverview,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions
};
