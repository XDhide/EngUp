const notificationsRepository = require('./notifications.Repository');
const { sendExpoPushNotification } = require('./expoPush.util');

async function notifyUser({ user_id, title, body, type, respectSettings = true }) {
  const settings = await notificationsRepository.findSettingsByUserId(user_id);
  const notification = await notificationsRepository.createNotification({ user_id, title, body, type });

  let push = { status: 'no_token' };
  const pushAllowed = !respectSettings || !settings || settings.review_reminder_enabled !== false;
  if (settings && settings.push_token && pushAllowed) {
    push = await sendExpoPushNotification({ pushToken: settings.push_token, title, body, data: { type } });
  }
  return { notification, push };
}

module.exports = { notifyUser };
