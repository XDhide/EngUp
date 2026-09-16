const cron = require('node-cron');
const { Op } = require('sequelize');
const { UserVocabularyCard } = require('../../../common/models');
const notificationsRepository = require('../notifications.Repository');
const { sendExpoPushNotification } = require('../expoPush.util');


function roundDownToFiveMinutes(date) {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return d;
}

function timeStringToBucketKey(timeStr) {

  if (!timeStr) return null;
  const [hh, mm] = timeStr.split(':').map(Number);
  const bucketMinute = Math.floor(mm / 5) * 5;
  return `${String(hh).padStart(2, '0')}:${String(bucketMinute).padStart(2, '0')}`;
}

function dateToBucketKey(date) {
  const rounded = roundDownToFiveMinutes(date);
  return `${String(rounded.getHours()).padStart(2, '0')}:${String(rounded.getMinutes()).padStart(2, '0')}`;
}

function interpolate(template, vars) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => (vars[key] !== undefined ? vars[key] : ''));
}

async function buildMessage(type, vars) {
  const template = await notificationsRepository.findTemplateByType(type);
  if (template) {
    return {
      title: interpolate(template.title_template, vars),
      body: interpolate(template.body_template, vars)
    };
  }


  if (type === 'review_due') {
    return {
      title: 'Đến giờ ôn từ! 🔔',
      body: `Bạn có ${vars.count} từ cần ôn tập hôm nay.`
    };
  }
  return {
    title: 'Nhắc học từ vựng 📚',
    body: 'Đã đến giờ học từ mới hôm nay, vào ôn luyện ngay nhé!'
  };
}

async function runReminderJob() {
  const nowBucket = dateToBucketKey(new Date());
  const settingsList = await notificationsRepository.findSettingsForReminderJob();

  const dueSettings = settingsList.filter(
    (s) => s.daily_reminder_time && timeStringToBucketKey(s.daily_reminder_time) === nowBucket
  );

  for (const settings of dueSettings) {
    const dueCount = await UserVocabularyCard.count({
      where: {
        user_id: settings.user_id,
        next_review_at: { [Op.lte]: new Date() }
      }
    });

    const type = dueCount > 0 ? 'review_due' : 'daily_reminder';
    const { title, body } = await buildMessage(type, { count: dueCount });

    await sendExpoPushNotification({ pushToken: settings.push_token, title, body });
    await notificationsRepository.createNotification({
      user_id: settings.user_id,
      title,
      body,
      type
    });
  }
}

function startReminderJob() {
  cron.schedule('*/5 * * * *', () => {
    runReminderJob().catch((err) => {
      console.error('❌ Lỗi khi chạy reminder job:', err.message);
    });
  });
  console.log('✅ Reminder job đã được lên lịch (mỗi 5 phút)');
}

module.exports = { startReminderJob, runReminderJob };
