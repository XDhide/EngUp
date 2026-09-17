require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../common/models');

const { sequelize, Sequelize } = db;
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const META_TABLE = 'SequelizeMeta';

async function ensureMetaTable(queryInterface) {
  const tables = await queryInterface.showAllTables();
  const exists = tables.map((t) => String(t).toLowerCase()).includes(META_TABLE.toLowerCase());

  if (!exists) {
    await queryInterface.createTable(META_TABLE, {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      }
    });
  }
}

async function getAppliedMigrations() {
  const [rows] = await sequelize.query(`SELECT name FROM \`${META_TABLE}\` ORDER BY name ASC`);
  return rows.map((row) => row.name);
}

function loadMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.js'))
    .sort();
}

async function runUp() {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMetaTable(queryInterface);

  const applied = await getAppliedMigrations();
  const pending = loadMigrationFiles().filter((file) => !applied.includes(file));

  if (pending.length === 0) {
    console.log('✅ Không có migration nào cần chạy. Database đã ở phiên bản mới nhất.');
    return;
  }

  for (const file of pending) {
    const migration = require(path.join(MIGRATIONS_DIR, file));
    console.log(`⏳ Đang chạy migration: ${file}...`);
    await migration.up(queryInterface, Sequelize);
    await sequelize.query(`INSERT INTO \`${META_TABLE}\` (name) VALUES (?)`, {
      replacements: [file]
    });
    console.log(`✅ Hoàn thành: ${file}`);
  }
}

async function runDown() {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMetaTable(queryInterface);

  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    console.log('ℹ️ Chưa có migration nào được áp dụng để rollback.');
    return;
  }

  const lastFile = applied[applied.length - 1];
  const migration = require(path.join(MIGRATIONS_DIR, lastFile));

  console.log(`⏳ Đang rollback migration: ${lastFile}...`);
  await migration.down(queryInterface, Sequelize);
  await sequelize.query(`DELETE FROM \`${META_TABLE}\` WHERE name = ?`, {
    replacements: [lastFile]
  });
  console.log(`✅ Rollback thành công: ${lastFile}`);
}

(async () => {
  try {
    console.log('⏳ Đang kết nối tới MySQL...');
    await sequelize.authenticate();
    console.log('✅ Kết nối thành công!');

    const command = process.argv[2] || 'up';

    if (command === 'up') {
      await runUp();
    } else if (command === 'down' || command === 'undo') {
      await runDown();
    } else {
      console.log('Sử dụng: node src/scripts/migrate.js [up|down]');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration thất bại:', error.message);
    process.exit(1);
  }
})();
