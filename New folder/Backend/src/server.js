// src/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const routes = require('./routes');
const errorMiddleware = require('./common/middlewares/error.middleware');

const app = express();

// ==== Middleware ====
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Giới hạn request (chống spam/brute-force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: 'Quá nhiều request, vui lòng thử lại sau.'
});
app.use('/api', limiter);

// ==== Routes ====
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'English Learning API is running 🚀' });
});

// ==== Error middleware (đặt cuối) ====
app.use(errorMiddleware);
require('dotenv').config();
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
// ==== Khởi động ====
const PORT = process.env.PORT || 5000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
  });
})();