const db = require('../models');
const { hashPassword } = require('../utils/password');

function defaultAdmins() {
  return [
    {
      email: process.env.ADMIN_EMAIL || 'admin@engup.test',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      full_name: process.env.ADMIN_NAME || 'Quản trị viên'
    },
    {
      email: process.env.ADMIN2_EMAIL || 'admin2@engup.test',
      password: process.env.ADMIN2_PASSWORD || 'Admin@123',
      full_name: process.env.ADMIN2_NAME || 'Quản trị viên 2'
    }
  ];
}

async function ensureAdmins({ log = console.log } = {}) {
  if (process.env.NODE_ENV === 'production' || process.env.AUTO_CREATE_ADMINS === 'false') {
    return [];
  }

  const created = [];
  for (const admin of defaultAdmins()) {
    const email = admin.email.trim().toLowerCase();
    const existing = await db.User.findOne({ where: { email } });
    if (existing) continue;

    await db.User.create({
      email,
      password_hash: await hashPassword(admin.password),
      full_name: admin.full_name,
      role: 'admin',
      level_current: 'C1',
      learning_goal: 'Quản trị hệ thống',
      daily_target_minutes: 30,
      is_active: true
    });
    created.push(email);
  }

  if (created.length > 0) log(`Đã tạo tài khoản admin còn thiếu: ${created.join(', ')}`);
  return created;
}

module.exports = { ensureAdmins };
