/**
 * npm run app      (chạy ở thư mục gốc EngUp, cùng cấp Backend / Mobile / MLSever)
 *
 * 1 lệnh làm hết:
 *   1) kiểm tra Docker + file model
 *   2) docker compose up -d --build   -> MySQL + MLSever(FastAPI) + Backend + seed dữ liệu mẫu
 *   3) chờ dịch vụ sẵn sàng, tự test /predict
 *   4) npm install (nếu cần) và chạy Expo cho Mobile ngay trong terminal này
 *
 * Tuỳ chọn:  npm run app -- --no-mobile     (chỉ chạy Backend + ML + DB)
 * Dừng:      Ctrl+C (tắt Expo)  rồi  npm run stop  (tắt Docker)
 */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MOBILE = path.join(ROOT, 'Mobile');
const MODEL = path.join(ROOT, 'MLSever', 'models', 'recall_model.joblib');
const isWin = process.platform === 'win32';
const noMobile = process.argv.includes('--no-mobile');

const say = (m) => console.log(`\n\x1b[36m[EngUp]\x1b[0m ${m}`);
const fail = (m) => { console.error(`\n\x1b[31m[EngUp] ${m}\x1b[0m`); process.exit(1); };
const run = (cmd, args, cwd = ROOT) =>
  spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin }).status === 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  Tài khoản mẫu: student1@engup.test / Student@123   |   admin@engup.test / Admin@123
`);

  // 4) Mobile
  if (noMobile) { say('Bỏ qua Mobile (--no-mobile). Tắt tất cả: npm run stop'); return; }
  if (!fs.existsSync(path.join(MOBILE, 'node_modules'))) {
    say('Cài thư viện Mobile (npm install, chỉ lần đầu)...');
    if (!run('npm', ['install'], MOBILE)) fail('npm install Mobile lỗi.');
  }
  say('Chạy Expo — quét QR bằng Expo Go. Dừng: Ctrl+C, rồi tắt Docker: npm run stop');
  const child = spawn('npm', ['start'], { cwd: MOBILE, stdio: 'inherit', shell: isWin });
  child.on('exit', (code) => process.exit(code ?? 0));
})();
