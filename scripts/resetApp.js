/**
 * npm run app:reset      (chạy ở thư mục gốc EngUp)
 *
 * Dùng để TEST: xoá sạch database rồi tạo lại từ đầu.
 *   1) Xoá TOÀN BỘ bảng trong database (giữ lại chính database)
 *   2) Nạp lại cấu trúc 28 bảng từ database_schema.sql, rồi chạy migration của Backend
 *      (bù những cột/bảng schema còn thiếu, vd. test_questions.is_approved)
 *   3) Tạo 2 tài khoản ADMIN để đăng nhập Website quản trị:
 *        - Admin 1: admin@engup.test  / Admin@123
 *        - Admin 2: admin2@engup.test / Admin@123
 *
 * npm run app:resettest  = reset + tạo 2 admin + nạp dữ liệu mẫu (tương đương app:reset -- --seed)
 *
 * Sau khi reset, nếu Backend đang chạy, script tự gọi thử đăng nhập admin để chắc chắn Backend
 * đọc đúng database vừa reset (nếu không sẽ báo rõ nguyên nhân).
 *
 * Tuỳ chọn (thêm sau dấu "--"):
 *   npm run app:reset -- --yes                  bỏ qua bước hỏi xác nhận
 *   npm run app:reset -- --seed                 nạp thêm dữ liệu mẫu (student1/2, từ vựng, đề thi...)
 *   npm run app:reset -- --docker               reset MySQL chạy bằng Docker (cổng 3307)
 *   npm run app:reset -- --local                reset MySQL cài trên máy (cổng DB_PORT hoặc 3306)
 *   npm run app:reset -- --email=a@b.com --password=Matkhau123 --name="Admin Một"      (đổi admin 1)
 *   npm run app:reset -- --email2=c@d.com --password2=Matkhau456 --name2="Admin Hai"   (đổi admin 2)
 *   (hoặc biến môi trường ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME và ADMIN2_EMAIL/ADMIN2_PASSWORD/ADMIN2_NAME)
 *
 * Mặc định (không có --docker/--local): thử cổng trong Backend/.env (DB_PORT, mặc định 3306),
 * nếu không kết nối được thì thử cổng Docker (MYSQL_PORT, mặc định 3307).
 *
 * An toàn:
 *   - Luôn hỏi xác nhận trước khi xoá (trừ khi có --yes)
 *   - Từ chối chạy nếu NODE_ENV=production
 *   - Từ chối nếu DB_HOST không phải máy local (trừ khi thêm --allow-remote)
 *
 * Lưu ý: script chỉ XOÁ BẢNG chứ không DROP DATABASE, nên Backend / MLSever đang chạy
 * vẫn dùng tiếp được, không cần khởi động lại.
 */
const { spawnSync } = require('child_process');
const { createRequire } = require('module');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'Backend');
const SCHEMA_FILE = path.join(ROOT_DIR, 'database_schema.sql');
const isWin = process.platform === 'win32';

const say = (m) => console.log(`\x1b[36m[EngUp]\x1b[0m ${m}`);
const ok = (m) => console.log(`\x1b[32m[EngUp] ✔ ${m}\x1b[0m`);
const warn = (m) => console.log(`\x1b[33m[EngUp] ! ${m}\x1b[0m`);
const fail = (m) => { console.error(`\x1b[31m[EngUp] ✖ ${m}\x1b[0m`); process.exit(1); };

// ─── Đọc tham số dòng lệnh ───────────────────────────────────────────────────
const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const getOpt = (name) => {
  const prefix = `--${name}=`;
  const found = argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};

const OPT = {
  yes: hasFlag('yes') || hasFlag('y') || argv.includes('-y'),
  seed: hasFlag('seed'),
  docker: hasFlag('docker'),
  local: hasFlag('local'),
  allowRemote: hasFlag('allow-remote'),
};

// 2 tài khoản admin sẽ được tạo
const ADMINS = [
  {
    email: (getOpt('email') || process.env.ADMIN_EMAIL || 'admin@engup.test').trim().toLowerCase(),
    password: getOpt('password') || process.env.ADMIN_PASSWORD || 'Admin@123',
    name: (getOpt('name') || process.env.ADMIN_NAME || 'Quản trị viên').trim(),
  },
  {
    email: (getOpt('email2') || process.env.ADMIN2_EMAIL || 'admin2@engup.test').trim().toLowerCase(),
    password: getOpt('password2') || process.env.ADMIN2_PASSWORD || 'Admin@123',
    name: (getOpt('name2') || process.env.ADMIN2_NAME || 'Quản trị viên 2').trim(),
  },
];

// ─── Kiểm tra đầu vào ────────────────────────────────────────────────────────
if (OPT.docker && OPT.local) fail('Không dùng đồng thời --docker và --local.');
if (process.env.NODE_ENV === 'production') fail('NODE_ENV=production — từ chối xoá database.');
if (!fs.existsSync(BACKEND_DIR)) fail(`Không tìm thấy thư mục Backend: ${BACKEND_DIR}`);
if (!fs.existsSync(SCHEMA_FILE)) fail(`Không tìm thấy file schema: ${SCHEMA_FILE}`);
ADMINS.forEach((a, i) => {
  const label = `Admin ${i + 1}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) fail(`${label}: email không hợp lệ "${a.email}"`);
  if (a.password.length < 8) fail(`${label}: mật khẩu phải có tối thiểu 8 ký tự.`);
  if (!a.name) fail(`${label}: tên không được để trống.`);
});
if (ADMINS[0].email === ADMINS[1].email) fail('Hai tài khoản admin không được trùng email.');

// ─── Đảm bảo Backend đã cài thư viện (cần mysql2, bcryptjs, dotenv) ─────────
function needInstall(dir) {
  const nm = path.join(dir, 'node_modules');
  if (!fs.existsSync(nm)) return true;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.keys(deps).some((d) => !fs.existsSync(path.join(nm, d)));
  } catch {
    return true;
  }
}

if (needInstall(BACKEND_DIR)) {
  say('Cài thư viện Backend (npm install)...');
  const r = spawnSync('npm', ['install'], { cwd: BACKEND_DIR, stdio: 'inherit', shell: true });
  if (r.status !== 0) fail('npm install Backend thất bại.');
}

const backendRequire = createRequire(path.join(BACKEND_DIR, 'package.json'));
const dotenv = backendRequire('dotenv');
const mysql = backendRequire('mysql2/promise');
const bcrypt = backendRequire('bcryptjs');

// .env của Backend (nếu thiếu thì dùng giá trị trong .env.example; biến đã có sẽ không bị ghi đè)
dotenv.config({ path: path.join(BACKEND_DIR, '.env'), quiet: true });
dotenv.config({ path: path.join(BACKEND_DIR, '.env.example'), quiet: true });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'EngUp_database';
const LOCAL_PORT = Number(process.env.DB_PORT) || 3306;
const DOCKER_PORT = Number(process.env.MYSQL_PORT) || 3307;

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
if (!LOCAL_HOSTS.includes(DB_HOST.toLowerCase()) && !OPT.allowRemote) {
  fail(
    `DB_HOST="${DB_HOST}" không phải máy local — từ chối xoá database từ xa.\n` +
    '  Nếu chắc chắn muốn reset, thêm: --allow-remote'
  );
}
if (!/^[A-Za-z0-9_$]+$/.test(DB_NAME)) fail(`Tên database không hợp lệ: "${DB_NAME}"`);

// ─── Kết nối MySQL ───────────────────────────────────────────────────────────
async function tryConnect(port) {
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
      charset: 'utf8mb4',
      connectTimeout: 4000,
    });
    return { conn, port };
  } catch (e) {
    return { error: e, port };
  }
}

async function connectAuto() {
  let ports;
  if (OPT.docker) ports = [DOCKER_PORT];
  else if (OPT.local) ports = [LOCAL_PORT];
  else ports = [...new Set([LOCAL_PORT, DOCKER_PORT])];

  const errors = [];
  for (const port of ports) {
    const res = await tryConnect(port);
    if (res.conn) return res;
    errors.push(res);
  }

  const lines = errors.map((e) => `  - ${DB_HOST}:${e.port} → ${e.error.code || ''} ${e.error.message}`);
  const hint = errors.some((e) => e.error.code === 'ER_ACCESS_DENIED_ERROR')
    ? '\n  Sai user/mật khẩu MySQL: kiểm tra DB_USER / DB_PASSWORD trong Backend/.env.'
    : '\n  MySQL chưa chạy? Với Docker: docker compose up -d mysql  (hoặc npm run app:docker).';
  fail(`Không kết nối được MySQL:\n${lines.join('\n')}${hint}`);
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function verifyBackendLogin(target, port) {
  const backendPort = Number(process.env.PORT) || 5000;
  const url = `http://localhost:${backendPort}/api/admin/auth/login`;
  const otherFlag = port === DOCKER_PORT ? '--local' : '--docker';
  const results = [];

  for (const acc of ADMINS) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      warn(`Backend chưa chạy tại cổng ${backendPort} nên chưa kiểm tra được đăng nhập. Khi chạy Backend, đăng nhập bằng 2 admin ở trên.`);
      return;
    }
    const json = await res.json().catch(() => ({}));
    results.push({ acc, status: res.status, message: json.message || '' });
  }

  const good = results.filter((r) => r.status === 200);
  if (good.length === results.length) {
    ok(`Kiểm tra đăng nhập qua Backend (cổng ${backendPort}): cả ${results.length} admin đều vào được.`);
    return;
  }

  const bad = results.filter((r) => r.status !== 200);
  for (const r of bad) warn(`Đăng nhập ${r.acc.email} thất bại: HTTP ${r.status} - ${r.message}`);

  if (bad.some((r) => /secretOrPrivateKey/i.test(r.message))) {
    warn('Backend thiếu JWT_SECRET / JWT_REFRESH_SECRET. Kiểm tra Backend/.env (copy từ .env.example) rồi khởi động lại Backend.');
  } else if (bad.some((r) => r.status === 401)) {
    warn(
      `Backend đang đọc một database KHÁC với nơi vừa reset (${target}).\n` +
      `  - Backend chạy bằng Docker (npm run app) → dùng MySQL cổng ${DOCKER_PORT}: chạy lại  npm run app:resettest -- --docker\n` +
      `  - Backend chạy bằng npm run dev → dùng MySQL cổng ${LOCAL_PORT}: chạy lại  npm run app:resettest -- --local\n` +
      `  (lần này đã reset cổng ${port}, hãy thử ${otherFlag}). Hoặc chỉ cần khởi động lại Backend: Backend sẽ tự tạo 2 admin còn thiếu trong database nó đang dùng.`
    );
  }
}

// ─── Chạy ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('');
  say('RESET DATABASE ĐỂ TEST');

  const { conn, port } = await connectAuto();
  const target = `${DB_HOST}:${port}/${DB_NAME}`;
  if (!OPT.docker && !OPT.local && port !== LOCAL_PORT) {
    warn(`Không kết nối được cổng ${LOCAL_PORT}, đã chuyển sang MySQL Docker (cổng ${port}).`);
  }

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${DB_NAME}\``);

    const [objects] = await conn.query(
      'SELECT TABLE_NAME AS name, TABLE_TYPE AS type FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [DB_NAME]
    );
    const [[{ users }]] = objects.some((o) => o.name === 'users')
      ? await conn.query('SELECT COUNT(*) AS users FROM `users`')
      : [[{ users: 0 }]];

    console.log(`
  Database đích : \x1b[33m${target}\x1b[0m
  Hiện đang có  : ${objects.length} bảng, ${users} tài khoản người dùng
  Sẽ làm        : XOÁ TOÀN BỘ dữ liệu → nạp lại schema → tạo 2 admin (${ADMINS.map((a) => a.email).join(', ')})${OPT.seed ? ' + dữ liệu mẫu' : ''}
`);

    if (!OPT.yes) {
      if (!process.stdin.isTTY) fail('Không có terminal để xác nhận. Chạy lại với: npm run app:reset -- --yes');
      const answer = await ask('\x1b[31mGõ "yes" để xác nhận XOÁ toàn bộ dữ liệu: \x1b[0m');
      if (answer.toLowerCase() !== 'yes') {
        say('Đã huỷ, database không bị thay đổi.');
        await conn.end();
        return;
      }
    }

    // 1) Xoá toàn bộ bảng / view hiện có
    say('Xoá toàn bộ bảng cũ...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const o of objects) {
      const kind = o.type === 'VIEW' ? 'VIEW' : 'TABLE';
      await conn.query(`DROP ${kind} IF EXISTS \`${o.name}\``);
    }
    ok(`Đã xoá ${objects.length} bảng.`);

    // 2) Nạp lại schema
    say('Nạp lại cấu trúc bảng từ database_schema.sql...');
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    await conn.query(schemaSql);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [DB_NAME]
    );
    ok(`Đã tạo ${total} bảng.`);

    // 2b) Chạy migration của Backend: database_schema.sql có thể chậm hơn code model
    //     (vd. thiếu cột test_questions.is_approved) — migration idempotent nên chạy an toàn.
    say('Chạy migration của Backend (bù các cột/bảng còn thiếu so với model)...');
    const dbEnv = { ...process.env, DB_HOST, DB_PORT: String(port), DB_USER, DB_PASSWORD, DB_NAME };
    const migRes = spawnSync('node', ['src/scripts/migrate.js', 'up'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      shell: isWin,
      env: dbEnv,
    });
    if (migRes.status !== 0) fail('Chạy migration thất bại (xem log phía trên).');
    ok('Migration xong.');

    // 3) Tạo 2 tài khoản admin
    say(`Tạo ${ADMINS.length} tài khoản admin...`);
    for (const acc of ADMINS) {
      const passwordHash = await bcrypt.hash(acc.password, 10); // cùng cách băm với Backend (bcrypt, 10 vòng)
      await conn.query(
        `INSERT INTO users
           (email, password_hash, full_name, role, level_current, learning_goal,
            daily_target_minutes, daily_new_word_limit, is_active)
         VALUES (?, ?, ?, 'admin', 'C1', 'Quản trị hệ thống', 30, 10, 1)`,
        [acc.email, passwordHash, acc.name]
      );

      // Kiểm tra lại: đọc từ DB và so khớp vai trò + mật khẩu
      const [[row]] = await conn.query(
        'SELECT id, role, is_active, password_hash FROM users WHERE email = ?',
        [acc.email]
      );
      const passOk = row && (await bcrypt.compare(acc.password, row.password_hash));
      if (!row || row.role !== 'admin' || !row.is_active || !passOk) {
        fail(`Tạo admin ${acc.email} xong nhưng kiểm tra lại không khớp — hãy kiểm tra bảng users.`);
      }
      ok(`Đã tạo admin ${acc.email} (id=${row.id}).`);
    }
    await conn.end();

    // 4) (Tuỳ chọn) dữ liệu mẫu
    if (OPT.seed) {
      say('Nạp dữ liệu mẫu (student1/2, từ vựng, bài đọc, bài nghe, đề thi...)...');
      const seedRes = spawnSync('node', ['src/common/seed/seed.js'], {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
        shell: isWin,
        env: dbEnv,
      });
      if (seedRes.status !== 0) fail('Nạp dữ liệu mẫu thất bại (xem log phía trên). 2 admin vẫn đã được tạo.');
      ok('Đã nạp dữ liệu mẫu.');
    }

    await verifyBackendLogin(target, port);

    console.log(`
\x1b[32m═══════════════════════════════════════════════\x1b[0m
\x1b[32m  RESET XONG — database: ${target}\x1b[0m
\x1b[32m═══════════════════════════════════════════════\x1b[0m
  2 tài khoản ADMIN (đăng nhập Website http://localhost:5173):
${ADMINS.map((a, i) => `    Admin ${i + 1}: \x1b[33m${a.email}\x1b[0m  /  \x1b[33m${a.password}\x1b[0m`).join('\n')}
${OPT.seed ? '  (Đã có thêm dữ liệu mẫu: student1/2@engup.test / Student@123, từ vựng, đề thi...)\n' : '  Database chỉ có 2 admin (chưa có học viên / học liệu). Thêm dữ liệu mẫu: npm run app:reset -- --seed\n'}
  Lưu ý: nếu Website/Mobile còn phiên đăng nhập cũ, hãy Đăng xuất (hoặc xoá dữ liệu trình duyệt / app)
         rồi đăng nhập lại.
`);
  } catch (e) {
    try { await conn.end(); } catch { /* bỏ qua */ }
    fail(`Reset thất bại: ${e.message}`);
  }
})();
