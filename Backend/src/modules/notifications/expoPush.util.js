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
      return { status: 'failed', error: ticket.message || 'Expo báo lỗi', code: ticket.details?.error || null };
    }
    return { status: 'sent' };
  } catch (err) {
    console.error(`❌ Lỗi khi gửi Expo push cho token ${pushToken}:`, err.message);
    return { status: 'failed', error: err.message };
  }
}

const isExpoToken = (t) => typeof t === 'string' && /^(Exponent|Expo)PushToken\[.+\]$/.test(t);

/**
 * Gửi nhiều thông báo trong ít request (Expo cho tối đa 100 tin/request).
 * messages: [{ pushToken, title, body, data }]
 * Trả về mảng kết quả cùng thứ tự: { status: 'sent' | 'failed', error?, code? }
 */
async function sendExpoPushBatch(messages) {
  const results = new Array(messages.length);
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((m) => ({ to: m.pushToken, sound: 'default', title: m.title, body: m.body, data: m.data || {} }))),
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) {
        chunk.forEach((_, k) => { results[i + k] = { status: 'failed', error: `Expo trả HTTP ${res.status}` }; });
        continue;
      }
      const json = await res.json().catch(() => null);
      const tickets = Array.isArray(json?.data) ? json.data : [];
      chunk.forEach((_, k) => {
        const t = tickets[k];
        if (!t) results[i + k] = { status: 'failed', error: 'Expo không trả kết quả cho tin này' };
        else if (t.status === 'error') results[i + k] = { status: 'failed', error: t.message || 'Expo báo lỗi', code: t.details?.error || null };
        else results[i + k] = { status: 'sent' };
      });
    } catch (err) {
      console.error('❌ Lỗi khi gửi lô Expo push:', err.message);
      chunk.forEach((_, k) => { results[i + k] = { status: 'failed', error: err.message }; });
    }
  }
  return results;
}

module.exports = { sendExpoPushNotification, sendExpoPushBatch, isExpoToken };
