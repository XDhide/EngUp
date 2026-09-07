// src/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công');
    conn.release();
  } catch (error) {
    console.error('❌ Kết nối MySQL thất bại:', error.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };