// src/scripts/migrateSql.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const runSqlMigration = async () => {
  let connection;
  try {
    const sqlPath = path.resolve(__dirname, '../../database_schema (1).sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Không tìm thấy file SQL tại: ${sqlPath}`);
    }

    console.log(`⏳ Đang đọc file schema từ: ${sqlPath}...`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('⏳ Đang kết nối tới MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    const dbName = process.env.DB_NAME || 'EngUp_database';
    console.log(`⏳ Đang tạo database "${dbName}" nếu chưa tồn tại...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    console.log(`⏳ Đang thực thi schema từ file SQL...`);
    await connection.query(sqlContent);

    console.log(`🎉 Chạy migration thành công! Cơ sở dữ liệu "${dbName}" đã sẵn sàng với toàn bộ 28 bảng.`);
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi thực thi SQL migration:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

runSqlMigration();

