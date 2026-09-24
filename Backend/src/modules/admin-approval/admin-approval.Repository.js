const {
  sequelize,
  AdminContentApprovalQueue,
  AuditLog,
  ReadingArticle,
  TestQuestion
} = require('../../common/models');

// content_id là khoá ngoại đa hình: content_type quyết định bảng nội dung tương ứng.
// Module này chỉ chạm tới cột `id` và `is_approved` của các bảng đó.
const CONTENT_MODELS = {
  reading_article: ReadingArticle,
  test_question: TestQuestion
};

// ---------- Transaction ----------

// Managed transaction: callback throw -> rollback, resolve -> commit.
async function withTransaction(callback) {
  return sequelize.transaction(callback);
}

// ---------- Hàng chờ duyệt (bảng do module này sở hữu) ----------

async function findPending({ type } = {}) {
  const where = { status: 'pending' };
  if (type) where.content_type = type;

  return AdminContentApprovalQueue.findAll({
    where,
    attributes: ['id', 'content_type', 'content_id', 'created_at'],
    order: [
      ['created_at', 'ASC'], // FIFO: yêu cầu cũ nhất được duyệt trước
      ['id', 'ASC']
    ]
  });
}

// Khoá dòng (SELECT ... FOR UPDATE) để hai admin bấm duyệt cùng lúc không xử lý trùng.
async function findQueueItemForUpdate(id, transaction) {
  return AdminContentApprovalQueue.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
}

async function markQueueItemReviewed(item, { status, reviewedBy, rejectReason = null }, transaction) {
  return item.update(
    {
      status,
      reject_reason: rejectReason,
      reviewed_by: reviewedBy,
      reviewed_at: new Date()
    },
    { transaction }
  );
}

// ---------- Bảng nội dung (tham chiếu qua content_id) ----------

async function contentExists(contentType, contentId, transaction) {
  const Model = CONTENT_MODELS[contentType];
  if (!Model) return false;

  const row = await Model.findByPk(contentId, { attributes: ['id'], transaction });
  return Boolean(row);
}

async function setContentApproved(contentType, contentId, transaction) {
  const Model = CONTENT_MODELS[contentType];
  if (!Model) return;

  await Model.update({ is_approved: true }, { where: { id: contentId }, transaction });
}

// ---------- Audit log (bảng do Admin sở hữu) ----------

async function createAuditLog({ actor_id, action, target_type, target_id, detail = null }, transaction) {
  return AuditLog.create({ actor_id, action, target_type, target_id, detail }, { transaction });
}

module.exports = {
  withTransaction,
  findPending,
  findQueueItemForUpdate,
  markQueueItemReviewed,
  contentExists,
  setContentApproved,
  createAuditLog
};
