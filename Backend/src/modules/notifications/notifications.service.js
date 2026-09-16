const notificationsRepository = require('./notifications.Repository');
const AppError = require('../../common/utils/AppError');
const { toSettingsDto, toNotificationDto } = require('./notifications.dtos');


async function getSettings(userId) {
  const settings = await notificationsRepository.findSettingsByUserId(userId);
  if (!settings) {
    return { daily_reminder_time: null, review_reminder_enabled: true };
  }
  return toSettingsDto(settings);
}

async function updateSettings(userId, { daily_reminder_time, review_reminder_enabled, push_token }) {
  const fieldsToUpdate = {};
  if (daily_reminder_time !== undefined) fieldsToUpdate.daily_reminder_time = daily_reminder_time;
  if (review_reminder_enabled !== undefined) fieldsToUpdate.review_reminder_enabled = review_reminder_enabled;
  if (push_token !== undefined) fieldsToUpdate.push_token = push_token;

  const settings = await notificationsRepository.upsertSettings(userId, fieldsToUpdate);
  return toSettingsDto(settings);
}



async function getNotifications(userId, { is_read }) {
  let parsedIsRead;
  if (is_read !== undefined) parsedIsRead = is_read === 'true' || is_read === true;

  const notifications = await notificationsRepository.findNotifications(userId, { is_read: parsedIsRead });
  return { notifications: notifications.map(toNotificationDto) };
}

async function markAsRead(userId, notificationId) {
  const notification = await notificationsRepository.findByIdForUser(notificationId, userId);
  if (!notification) {
    throw new AppError('Thông báo không tồn tại', 404);
  }
  await notificationsRepository.markAsRead(notification);
  return null;
}

module.exports = {
  getSettings,
  updateSettings,
  getNotifications,
  markAsRead
};
