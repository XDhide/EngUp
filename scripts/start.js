/**
 * npm run app      (chạy ở thư mục gốc EngUp, cùng cấp Backend / Mobile / MLSever / Website)
 *
 * 1 lệnh làm hết:
 *   1) kiểm tra Docker + file model
 *   2) docker compose up -d --build   -> MySQL + MLSever(FastAPI) + Backend + seed dữ liệu mẫu
 *   3) chờ dịch vụ sẵn sàng, tự test /predict
 *   4) npm install Website (nếu thiếu) + tạo .env + chạy Vite ở nền (log có tiền tố [Web])
 *   5) npm install Mobile (nếu thiếu) và chạy Expo ngay trong terminal này
 *
 * Tuỳ chọn:
 *   npm run app -- --no-mobile     (không chạy Expo; Website vẫn chạy, Ctrl+C để dừng)
 *   npm run app -- --no-web        (không chạy Website)
 * Dừng:      Ctrl+C (tắt Expo + Website)  rồi  npm run stop  (tắt Docker)
 */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MOBILE = path.join(ROOT, 'Mobile');
const WEB = path.join(ROOT, 'Website', 'engup');
const MODEL = path.join(ROOT, 'MLSever', 'models', 'recall_model.joblib');
const isWin = process.platform === 'win32';
const noMobile = process.argv.includes('--no-mobile');
const noWeb = process.argv.includes('--no-web');

const say = (m) => console.log(`\n\x1b[36m[EngUp]\x1b[0m ${m}`);
const fail = (m) => { console.error(`\n\x1b[31m[EngUp] ${m}\x1b[0m`); process.exit(1); };
const run = (cmd, args, cwd = ROOT) =>
  spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin }).status === 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cần npm install nếu chưa có node_modules, hoặc package.json có thư viện chưa được cài
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

// Website cần VITE_API_URL: tự tạo .env từ .env.example nếu chưa có
function ensureWebEnv(dir) {
  const env = path.join(dir, '.env');
  const example = path.join(dir, '.env.example');
  if (!fs.existsSync(env) && fs.existsSync(example)) {
    fs.copyFileSync(example, env);
    console.log('\x1b[32m  Website: đã tạo .env từ .env.example\x1b[0m');
  }
}

// Tắt cả cây tiến trình (Windows: taskkill /T, Linux/macOS: kill nhóm tiến trình)
function killTree(child) {
  if (!child || child.exitCode !== null || !child.pid) return;
  try {
    if (isWin) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-child.pid);
  } catch { /* đã thoát */ }
}

async function waitFor(name, url, timeoutMs = 180000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(2000) }); // bất kỳ HTTP response nào = dịch vụ đã lên
      return true;
    } catch { await sleep(2000); }
  }
  return false;
}

(async () => {
  // 1) Docker
  say('Kiểm tra Docker...');
  const docker = spawnSync('docker', ['info'], { stdio: 'ignore', shell: isWin });
  if (docker.status !== 0) fail('Docker chưa chạy. Hãy mở Docker Desktop, đợi nó khởi động xong rồi chạy lại: npm run app');

  if (!fs.existsSync(path.join(ROOT, 'Backend', '.env'))) fail('Thiếu Backend/.env (cần JWT_SECRET, JWT_REFRESH_SECRET...).');
  if (!fs.existsSync(MODEL)) {
    console.warn('\x1b[33m[EngUp] Chưa có MLSever/models/recall_model.joblib -> ML dùng SM-2 dự phòng.\x1b[0m');
  }

  // 2) Build + chạy (thử lại 3 lần: pip/npm có thể đứt mạng giữa chừng, cache giúp không tải lại từ đầu)
  say('Build & chạy MySQL + MLSever + Backend (lần đầu có thể mất vài phút)...');
  let ok = false;
  for (let i = 1; i <= 3 && !ok; i++) {
    if (i > 1) say(`Thử lại lần ${i}/3 (thường do mạng chậm)...`);
    ok = run('docker', ['compose', 'up', '-d', '--build']);
  }
  if (!ok) fail('docker compose lỗi. Xem log phía trên (hoặc: docker compose logs).');

  // 3) Chờ sẵn sàng
  say('Chờ dịch vụ khởi động...');
  const mlUp = await waitFor('MLSever', 'http://localhost:8000/health');
  const beUp = await waitFor('Backend', 'http://localhost:5000/');
  if (!mlUp || !beUp) {
    run('docker', ['compose', 'ps']);
    fail(`${!mlUp ? 'MLSever ' : ''}${!beUp ? 'Backend ' : ''}chưa lên. Xem log: docker compose logs -f`);
  }

  // Test nhanh model
  try {
    const iso = (d) => new Date(Date.now() - d * 864e5).toISOString();
    const r = await fetch('http://localhost:8000/predict', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 1, word_id: 1, review_history: [
        { result: 'good', reviewed_at: iso(9) }, { result: 'good', reviewed_at: iso(7) }, { result: 'hard', reviewed_at: iso(2) } ] }),
    });
    const d = (await r.json()).data;
    console.log(d.used_fallback_sm2
      ? '\x1b[33m  ML: đang dùng SM-2 dự phòng (chưa nạp được model)\x1b[0m'
      : `\x1b[32m  ML: đã nạp model ${d.model_version} | recall_probability=${d.recall_probability}\x1b[0m`);
  } catch (e) { console.warn('  Không test được /predict:', e.message); }

  console.log(`
\x1b[32m✔ Sẵn sàng\x1b[0m
  Backend API : http://localhost:5000/api
  ML Swagger  : http://localhost:8000/docs
  MySQL       : localhost:3307  (user root / mật khẩu: admin)
  Website     : http://localhost:5173   (đăng nhập admin@engup.test / Admin@123)
  Tài khoản mẫu: student1@engup.test / Student@123   |   admin@engup.test / Admin@123
`);

  // 4) Website: luôn đảm bảo đủ thư viện, rồi chạy Vite ở nền
  let web = null;
  if (!noWeb && fs.existsSync(WEB)) {
    if (needInstall(WEB)) {
      say('Cài thư viện Website (npm install)...');
      if (!run('npm', ['install'], WEB)) fail('npm install Website lỗi.');
    }
    ensureWebEnv(WEB);

    say('Chạy Website (Vite) tại http://localhost:5173');
    web = spawn('npm', ['run', 'dev', '--', '--host'], {
      cwd: WEB,
      shell: isWin,
      detached: !isWin, // Linux/macOS: tạo nhóm tiến trình riêng để tắt được cả Vite
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const tag = (d) => d.toString().split('\n').filter((l) => l.trim())
      .forEach((l) => console.log(`\x1b[35m[Web]\x1b[0m ${l}`));
    web.stdout.on('data', tag);
    web.stderr.on('data', tag);
    web.on('error', (e) => console.error(`\x1b[31m[Web] Lỗi chạy Website: ${e.message}\x1b[0m`));
  }

  let expo = null;
  const stopAll = () => killTree(web);
  process.on('exit', stopAll);
  process.on('SIGINT', () => { stopAll(); if (!expo) process.exit(0); }); // có Expo thì để Expo tự thoát rồi mới thoát
  process.on('SIGTERM', () => { stopAll(); process.exit(0); });

  // 5) Mobile
  if (noMobile) {
    say(web
      ? 'Bỏ qua Mobile (--no-mobile). Website đang chạy, Ctrl+C để dừng; tắt Docker: npm run stop'
      : 'Bỏ qua Mobile (--no-mobile). Tắt tất cả: npm run stop');
    return;
  }
  if (needInstall(MOBILE)) {
    say('Cài thư viện Mobile (npm install, chỉ lần đầu)...');
    if (!run('npm', ['install'], MOBILE)) { stopAll(); fail('npm install Mobile lỗi.'); }
  }
  say('Chạy Expo — quét QR bằng Expo Go. Dừng: Ctrl+C, rồi tắt Docker: npm run stop');
  expo = spawn('npm', ['start'], { cwd: MOBILE, stdio: 'inherit', shell: isWin });
  expo.on('exit', (code) => { stopAll(); process.exit(code ?? 0); });
})();