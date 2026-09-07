// src/scripts/syncDb.js
require('dotenv').config();
const db = require('../common/models');

const sync = async () => {
  try {
    console.log('⏳ Đang kết nối tới MySQL...');
    await db.sequelize.authenticate();
    console.log('✅ Kết nối thành công!');

    const isForce = process.argv.includes('--force');
    const isAlter = process.argv.includes('--alter') || !isForce;

    console.log(`⏳ Bắt đầu đồng bộ hóa cấu trúc bảng (force: ${isForce}, alter: ${isAlter})...`);
    await db.sequelize.sync({ alter: isAlter, force: isForce });

    console.log('🎉 Toàn bộ 28 bảng và quan hệ Foreign Key đã được đồng bộ thành công vào MySQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Đồng bộ cơ sở dữ liệu thất bại:', error);
    process.exit(1);
  }
};

sync();

