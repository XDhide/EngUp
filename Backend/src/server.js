require('dotenv').config();

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

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Quá nhiều request, vui lòng thử lại sau.'
});
app.use('/api', limiter);

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
      console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server do lỗi kết nối Database:', error.message);
  }
})();
