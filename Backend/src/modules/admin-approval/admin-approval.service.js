const adminApprovalRepository = require('./admin-approval.Repository');
const AppError = require('../../common/utils/AppError');
const { toQueueItemDto } = require('./admin-approval.dtos');

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  }
}

// Lấy yêu cầu trong hàng chờ (đã khoá dòng) và bảo đảm nó vẫn đang 'pending'.
async function loadPendingItem(queueId, transaction) {
  const item = await adminApprovalRepository.findQueueItemForUpdate(queueId, transaction);

  if (!item) {
    throw new AppError('Yêu cầu duyệt không tồn tại', 404);
  }
  if (item.status !== 'pending') {
    throw new AppError(`Yêu cầu này đã được xử lý (${item.status})`, 409);
  }
  return item;
}

async function getPendingItems(requester, { type } = {}) {
  assertAdmin(requester);

  const items = await adminApprovalRepository.findPending({ type });
  return { items: items.map(toQueueItemDto) };
}

async function approveContent(requester, queueId) {
  assertAdmin(requester);

  await adminApprovalRepository.withTransaction(async (transaction) => {
    const item = await loadPendingItem(queueId, transaction);

    const exists = await adminApprovalRepository.contentExists(item.content_type, item.content_id, transaction);
    if (!exists) {
      throw new AppError('Nội dung cần duyệt không còn tồn tại', 404);
    }

    await adminApprovalRepository.setContentApproved(item.content_type, item.content_id, transaction);
    await adminApprovalRepository.markQueueItemReviewed(
      item,
      { status: 'approved', reviewedBy: requester.id },
      transaction
    );
    await adminApprovalRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'content.approve',
        target_type: item.content_type,
        target_id: item.content_id,
        detail: { queue_id: item.id }
      },
      transaction
    );
  });

  return null;
}

async function rejectContent(requester, queueId, rejectReason) {
  assertAdmin(requester);

  await adminApprovalRepository.withTransaction(async (transaction) => {
    const item = await loadPendingItem(queueId, transaction);

    await adminApprovalRepository.markQueueItemReviewed(
      item,
      { status: 'rejected', reviewedBy: requester.id, rejectReason },
      transaction
    );
    await adminApprovalRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'content.reject',
        target_type: item.content_type,
        target_id: item.content_id,
        detail: { queue_id: item.id, reject_reason: rejectReason }
      },
      transaction
    );
  });

  return null;
}

module.exports = {
  getPendingItems,
  approveContent,
  rejectContent
};
