const adminApprovalService = require('./admin-approval.service');
const { successResponse } = require('../../common/utils/response');

async function getPending(req, res, next) {
  try {
    const data = await adminApprovalService.getPendingItems(req.user, { type: req.query.type });
    return successResponse(res, { message: 'Lấy hàng chờ duyệt thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    await adminApprovalService.approveContent(req.user, req.params.id);
    return successResponse(res, { message: 'Duyệt nội dung thành công', data: null, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    await adminApprovalService.rejectContent(req.user, req.params.id, req.body.reject_reason);
    return successResponse(res, { message: 'Từ chối nội dung thành công', data: null, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPending,
  approve,
  reject
};
