const adminDashboardService = require('./admin-dashboard.service');
const { successResponse } = require('../../common/utils/response');

// Bọc handler: gọi service, trả response chuẩn, đẩy lỗi cho error.middleware.
function handler(message, statusCode, call) {
  return async (req, res, next) => {
    try {
      const data = await call(req);
      return successResponse(res, { message, data, statusCode });
    } catch (err) {
      next(err);
    }
  };
}

// ---------- Mẫu thông báo ----------
const createTemplate = handler('Tạo mẫu thông báo thành công', 201, (req) =>
  adminDashboardService.createTemplate(req.user, req.body)
);
const updateTemplate = handler('Cập nhật mẫu thông báo thành công', 200, (req) =>
  adminDashboardService.updateTemplate(req.user, req.params.id, req.body)
);
const deleteTemplate = handler('Xoá mẫu thông báo thành công', 200, (req) =>
  adminDashboardService.deleteTemplate(req.user, req.params.id)
);
const getSentHistory = handler('Lấy lịch sử thông báo thành công', 200, (req) =>
  adminDashboardService.getSentHistory(req.user, req.filters)
);

// ---------- Dashboard ----------
const getOverview = handler('Lấy tổng quan hệ thống thành công', 200, (req) =>
  adminDashboardService.getOverview(req.user)
);

// ---------- Gói cước ----------
const createPlan = handler('Tạo gói cước thành công', 201, (req) =>
  adminDashboardService.createPlan(req.user, req.body)
);
const updatePlan = handler('Cập nhật gói cước thành công', 200, (req) =>
  adminDashboardService.updatePlan(req.user, req.params.id, req.body)
);
const deletePlan = handler('Xoá gói cước thành công', 200, (req) =>
  adminDashboardService.deletePlan(req.user, req.params.id)
);
const getSubscriptions = handler('Lấy danh sách đăng ký gói thành công', 200, (req) =>
  adminDashboardService.getSubscriptions(req.user, req.filters)
);

module.exports = {
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
