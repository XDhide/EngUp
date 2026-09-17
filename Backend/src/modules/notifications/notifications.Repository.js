const { Op } = require('sequelize');
const { NotificationSetting, Notification, NotificationTemplate } = require('../../common/models');

async function findSettingsByUserId(userId) {
  return NotificationSetting.findOne({ where: { user_id: userId } });
}

async function upsertSettings(userId, fieldsToUpdate) {
  const [settings] = await NotificationSetting.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId }
  });
  await settings.update(fieldsToUpdate);
  return settings;
}

async function findNotifications(userId, { is_read } = {}) {
  const where = { user_id: userId };
  if (is_read !== undefined) where.is_read = is_read;

  return Notification.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: 50 
  });
}

async function findByIdForUser(id, userId) {
  return Notification.findOne({ where: { id, user_id: userId } });
}

async function markAsRead(notification) {
  await notification.update({ is_read: true });
  return notification;
}

async function createNotification({ user_id, title, body, type }) {
  return Notification.create({ user_id, title, body, type });
}


async function findTemplateByType(type) {
  return NotificationTemplate.findOne({ where: { type } });
}



async function findSettingsForReminderJob() {
  return NotificationSetting.findAll({
    where: {
      review_reminder_enabled: true,
      push_token: { [Op.ne]: null }
    }
  });
}

module.exports = {
  findSettingsByUserId,
  upsertSettings,
  findNotifications,
  findByIdForUser,
  markAsRead,
  createNotification,
  findTemplateByType,
  findSettingsForReminderJob
};
