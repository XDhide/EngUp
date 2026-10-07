const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPushNotification({ pushToken, title, body, data }) {
  if (!pushToken) return { status: 'no_token' };

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
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.error(`❌ Expo push thất bại (HTTP ${res.status}) cho token ${pushToken}`);
      return { status: 'failed', error: `Expo trả HTTP ${res.status}` };
    }

    const result = await res.json().catch(() => null);
    const ticket = Array.isArray(result?.data) ? result.data[0] : result?.data;
    if (ticket?.status === 'error') {
      console.error(`❌ Expo push báo lỗi cho token ${pushToken}:`, ticket.message);
      return { status: 'failed', error: ticket.message || 'Expo báo lỗi' };
    }
    return { status: 'sent' };
  } catch (err) {
    console.error(`❌ Lỗi khi gửi Expo push cho token ${pushToken}:`, err.message);
    return { status: 'failed', error: err.message };
  }
}

module.exports = { sendExpoPushNotification };
