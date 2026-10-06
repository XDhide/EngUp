require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const db = require('./common/models');
const routes = require('./routes');
const errorMiddleware = require('./common/middlewares/error.middleware');
const { scheduleStreakJob } = require('./modules/streaks/streaks.job');

const app = express();

// crossOriginResourcePolicy: cross-origin -> cho phép Website (cổng 5173) và Mobile tải audio từ /uploads
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Rate limit ----
// Trước đây: 100 request / 15 phút theo IP cho TOÀN BỘ API -> nhiều người cùng dùng chung một mạng
// (wifi lớp học, demo trước hội đồng) bị gộp chung 1 IP nên rất nhanh gặp "Too Many Requests".
// Giờ: giới hạn theo TỪNG TÀI KHOẢN (đọc user id trong JWT), chỉ fallback về IP khi chưa đăng nhập.
const jwt = require('jsonwebtoken');
const { ipKeyGenerator } = require('express-rate-limit');

if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

function rateLimitKey(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const payload = jwt.decode(auth.slice(7)); // chỉ lấy làm khoá đếm, việc xác thực do auth.middleware làm
    if (payload && payload.id) return `user:${payload.id}`;
  }
  return `ip:${ipKeyGenerator(req.ip)}`;
}

const tooMany = (message) => (req, res) =>
  res.status(429).json({ success: false, message, data: null });

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 300, // 300 request / phút / tài khoản
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Bạn thao tác quá nhanh, vui lòng thử lại sau ít giây.')
});

// Chống dò mật khẩu: chỉ áp cho đăng nhập/đăng ký, tính theo IP nhưng đủ rộng cho nhiều người dùng chung mạng.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 300,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip)}`,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // chỉ đếm lần đăng nhập/đăng ký THẤT BẠI
  handler: tooMany('Quá nhiều lần đăng nhập/đăng ký thất bại, vui lòng thử lại sau.')
});

// ---- File tĩnh: audio lưu ngay trong thư mục Backend/uploads của server ----
// (phải đặt TRƯỚC rate limit để phát audio không tốn quota API)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*')
}));

// DB lưu đường dẫn tương đối (/uploads/audio/x.mp3). Trả ra client dưới dạng URL tuyệt đối để
// Mobile/Website phát được. Đặt PUBLIC_BASE_URL (vd http://192.168.1.10:5000) nếu chạy sau proxy.
function absolutizeUploads(value, base) {
  if (Array.isArray(value)) return value.map((v) => absolutizeUploads(v, base));
  if (value && typeof value === 'object' && !(value instanceof Date) && typeof value.toJSON !== 'function') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === 'audio_url' && typeof v === 'string' && v.startsWith('/uploads/') ? base + v : absolutizeUploads(v, base);
    }
    return out;
  }
  return value;
}
app.use('/api', (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
    return originalJson(absolutizeUploads(body, base));
  };
  next();
});

app.use('/api', limiter);
app.use(['/api/auth/login', '/api/auth/register', '/api/admin/auth/login'], authLimiter);

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'English Learning API is running 🚀' });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await testConnection();
    scheduleStreakJob();
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Không thể khởi động server do lỗi kết nối Database:', error.message);
  }
})();
