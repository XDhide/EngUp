const { Op } = require('sequelize');
const {
  sequelize,
  NotificationTemplate,
  SubscriptionPlan,
  Subscription,
  AuditLog,
  // Các model dưới đây thuộc module khác -> CHỈ ĐỌC (thống kê / lịch sử).
  Notification,
  User,
  ReviewLog,
  ReadingAttempt,
  ListeningDictationAttempt,
  UserTestAttempt,
  ErrorLog
} = require('../../common/models');

// ---------- Transaction ----------

// Managed transaction: callback throw -> rollback, resolve -> commit.
async function withTransaction(callback) {
  return sequelize.transaction(callback);
}

// ---------- Mẫu thông báo (bảng do module này sở hữu) ----------

async function findTemplateById(id, transaction) {
  return NotificationTemplate.findByPk(id, { transaction });
}

async function findTemplateByName(name, transaction) {
  return NotificationTemplate.findOne({ where: { name }, transaction });
}

async function createTemplate(data, transaction) {
  return NotificationTemplate.create(data, { transaction });
}

async function updateTemplate(template, patch, transaction) {
  return template.update(patch, { transaction });
}

async function destroyTemplate(template, transaction) {
  return template.destroy({ transaction });
}

// ---------- Lịch sử thông báo đã gửi (bảng notifications của module Notifications -> CHỈ ĐỌC) ----------

async function findSentNotifications({ from, to, limit }) {
  const where = {};
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = from;
    if (to) where.created_at[Op.lte] = to;
  }

  return Notification.findAll({
    where,
    attributes: ['id', 'user_id', 'title', 'body', 'type', 'is_read', 'created_at'],
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC']
    ],
    limit
  });
}

// ---------- Thống kê dashboard (đọc read-only, không ghi vào bảng nào) ----------

async function countUsers() {
  return User.count();
}

// Id người dùng có hoạt động học trong [from, to) — cùng định nghĩa "có hoạt động" với streak job
// (ôn từ, nộp bài đọc, nộp bài nghe). Trả về danh sách id đã khử trùng lặp.
async function findActiveUserIds({ from, to }) {
  const range = (column) => ({ [column]: { [Op.gte]: from, [Op.lt]: to } });
  const distinctUsers = (Model, column) =>
    Model.findAll({ attributes: ['user_id'], where: range(column), group: ['user_id'], raw: true });

  const [reviews, readings, listenings] = await Promise.all([
    distinctUsers(ReviewLog, 'reviewed_at'),
    distinctUsers(ReadingAttempt, 'submitted_at'),
    distinctUsers(ListeningDictationAttempt, 'submitted_at')
  ]);

  const ids = new Set();
  [...reviews, ...readings, ...listenings].forEach((row) => ids.add(Number(row.user_id)));
  return [...ids];
}

async function countTestAttempts() {
  const [total, submitted] = await Promise.all([
    UserTestAttempt.count(),
    UserTestAttempt.count({ where: { status: 'submitted' } })
  ]);
  return { total, submitted };
}

// Bảng error_logs thuộc module admin-logs -> CHỈ ĐỌC.
async function findRecentErrors(limit) {
  return ErrorLog.findAll({
    where: { level: { [Op.in]: ['error', 'critical'] } },
    attributes: ['service', 'level', 'message', 'created_at'],
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC']
    ],
    limit
  });
}

// ---------- Gói cước (bảng do module này sở hữu) ----------

async function findPlanById(id, transaction) {
  return SubscriptionPlan.findByPk(id, { transaction });
}

async function createPlan(data, transaction) {
  return SubscriptionPlan.create(data, { transaction });
}

async function updatePlan(plan, patch, transaction) {
  return plan.update(patch, { transaction });
}

async function destroyPlan(plan, transaction) {
  return plan.destroy({ transaction });
}

async function countSubscriptionsOfPlan(planId, transaction) {
  return Subscription.count({ where: { plan_id: planId }, transaction });
}

async function findSubscriptions({ user_id, status, limit }) {
  const where = {};
  if (user_id) where.user_id = user_id;
  if (status) where.status = status;

  return Subscription.findAll({
    where,
    attributes: ['id', 'user_id', 'plan_id', 'status', 'start_date', 'end_date', 'created_at'],
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC']
    ],
    limit
  });
}

// ---------- Audit log (bảng do Admin sở hữu) ----------

async function createAuditLog({ actor_id, action, target_type, target_id, detail = null }, transaction) {
  return AuditLog.create({ actor_id, action, target_type, target_id, detail }, { transaction });
}

module.exports = {
  withTransaction,
  findTemplateById,
  findTemplateByName,
  createTemplate,
  updateTemplate,
  destroyTemplate,
  findSentNotifications,
  countUsers,
  findActiveUserIds,
  countTestAttempts,
  findRecentErrors,
  findPlanById,
  createPlan,
  updatePlan,
  destroyPlan,
  countSubscriptionsOfPlan,
  findSubscriptions,
  createAuditLog
};
