const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Gửi 1 push notification tới 1 Expo push token. Không throw khi Expo báo lỗi
// cho từng token riêng lẻ (vd token hết hạn) — chỉ log, để không làm chết cả job
// khi có 1 user bị lỗi token.
async function sendExpoPushNotification({ pushToken, title, body, data }) {
  if (!pushToken) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {}
      })
    });

    if (!res.ok) {
      console.error(`❌ Expo push thất bại (HTTP ${res.status}) cho token ${pushToken}`);
      return;
    }

    const result = await res.json();
    if (result?.data?.status === 'error') {
      console.error(`❌ Expo push báo lỗi cho token ${pushToken}:`, result.data.message);
    }
  } catch (err) {
    console.error(`❌ Lỗi khi gửi Expo push cho token ${pushToken}:`, err.message);
  }
}

module.exports = { sendExpoPushNotification };
