const adminLogsService = require('./admin-logs.service');
const { successResponse } = require('../../common/utils/response');

async function getErrorLogs(req, res, next) {
  try {
    const data = await adminLogsService.getErrorLogs(req.user, req.filters);
    return successResponse(res, { message: 'Lấy log lỗi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const data = await adminLogsService.getAuditLogs(req.user, req.filters);
    return successResponse(res, { message: 'Lấy audit log thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getErrorLogs,
  getAuditLogs
};
