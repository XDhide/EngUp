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

const TYPE_LABELS = {
  reading_article: 'bài đọc',
  test_question: 'câu hỏi đề thi',
  vocabulary_word: 'từ vựng',
  learning_path: 'lộ trình học'
};

async function notifySubmitter(item, { approved, reason }, transaction) {
  if (!item.submitted_by) return;
  const label = TYPE_LABELS[item.content_type] || 'nội dung';
  const name = item.title ? ` "${String(item.title).slice(0, 80)}"` : '';
  await adminApprovalRepository.createNotification(
    {
      user_id: item.submitted_by,
      type: approved ? 'content_approved' : 'content_rejected',
      title: approved ? 'Đóng góp của bạn đã được duyệt 🎉' : 'Đóng góp của bạn chưa được duyệt',
      body: approved
        ? `Cảm ơn bạn! ${label[0].toUpperCase()}${label.slice(1)}${name} đã được duyệt và hiển thị cho mọi người.`
        : `${label[0].toUpperCase()}${label.slice(1)}${name} bị từ chối. Lý do: ${reason}`
    },
    transaction
  );
}

async function getItemDetail(requester, queueId) {
  assertAdmin(requester);
  const item = await adminApprovalRepository.findQueueItemById(queueId);
  if (!item) {
    throw new AppError('Yêu cầu duyệt không tồn tại', 404);
  }
  const content = await adminApprovalRepository.getContentDetail(item.content_type, item.content_id);
  return {
    ...toQueueItemDto(item),
    status: item.status,
    reject_reason: item.reject_reason || null,
    content
  };
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
    await notifySubmitter(item, { approved: true }, transaction);
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
    await notifySubmitter(item, { approved: false, reason: rejectReason }, transaction);
  });

  return null;
}

module.exports = {
  getPendingItems,
  getItemDetail,
  approveContent,
  rejectContent
};
