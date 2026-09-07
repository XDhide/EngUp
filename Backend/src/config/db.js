// src/config/db.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'EngUp_database',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      freezeTableName: true
    }
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối MySQL qua Sequelize thành công!');
  } catch (error) {
    console.error('❌ Kết nối MySQL thất bại:', error.message);
    throw error;
  }
}

module.exports = { sequelize, testConnection };