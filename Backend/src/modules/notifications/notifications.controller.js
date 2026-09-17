const notificationsService = require('./notifications.service');
const { successResponse } = require('../../common/utils/response');

async function getSettings(req, res, next) {
  try {
    const data = await notificationsService.getSettings(req.user.id);
    return successResponse(res, { message: 'Lấy cấu hình nhắc nhở thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { daily_reminder_time, review_reminder_enabled, push_token } = req.body;
    const data = await notificationsService.updateSettings(req.user.id, {
      daily_reminder_time,
      review_reminder_enabled,
      push_token
    });
    return successResponse(res, { message: 'Cập nhật cấu hình nhắc nhở thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getNotifications(req, res, next) {
  try {
    const { is_read } = req.query;
    const data = await notificationsService.getNotifications(req.user.id, { is_read });
    return successResponse(res, { message: 'Lấy lịch sử thông báo thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const data = await notificationsService.markAsRead(req.user.id, req.params.id);
    return successResponse(res, { message: 'Đánh dấu đã đọc thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getNotifications,
  markAsRead
};
