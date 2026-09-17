function toSettingsDto(settings) {
  return {
    daily_reminder_time: settings.daily_reminder_time,
    review_reminder_enabled: settings.review_reminder_enabled
  };
}

function toNotificationDto(notification) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    is_read: notification.is_read,
    created_at: notification.created_at
  };
}

module.exports = {
  toSettingsDto,
  toNotificationDto
};
