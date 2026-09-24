const adminLogsRepository = require('./admin-logs.Repository');
const AppError = require('../../common/utils/AppError');
const { toErrorLogDto, toAuditLogDto } = require('./admin-logs.dtos');

// Giới hạn cứng số dòng trả về để bảng log lớn không làm treo API / trình duyệt.
const MAX_LOGS = 500;

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  }
}

// filters đã được validation chuẩn hoá: { service?, from?: Date, to?: Date }
async function getErrorLogs(requester, { service, from, to } = {}) {
  assertAdmin(requester);

  const logs = await adminLogsRepository.findErrorLogs({ service, from, to, limit: MAX_LOGS });
  return { logs: logs.map(toErrorLogDto) };
}

// filters đã được validation chuẩn hoá: { actor_id?: number, action?: string }
async function getAuditLogs(requester, { actor_id, action } = {}) {
  assertAdmin(requester);

  const logs = await adminLogsRepository.findAuditLogs({ actor_id, action, limit: MAX_LOGS });
  return { logs: logs.map(toAuditLogDto) };
}

module.exports = {
  MAX_LOGS,
  getErrorLogs,
  getAuditLogs
};
