/**
 * npm run app  (chạy ở thư mục gốc EngUp)
 *
 * Tự động:
 *   1) npm install cho Backend  (nếu thiếu node_modules hoặc thiếu thư viện)
 *   2) npm install cho Mobile   (nếu thiếu node_modules hoặc thiếu thư viện)
 *   3) npm install cho Website  (nếu thiếu node_modules hoặc thiếu thư viện)
 *      + tự tạo Website/engup/.env từ .env.example nếu chưa có
 *   Sau đó mở 4 cửa sổ terminal riêng – mỗi cửa sổ tự lo setup:
 *     ┌─ "EngUp Backend"  → npm run dev
 *     ├─ "EngUp Mobile"   → npm start
 *     ├─ "EngUp MLSever"  → tạo venv (nếu cần) + pip install + uvicorn
 *     └─ "EngUp Website"  → npm run dev (Vite, mở được từ máy khác cùng mạng)
 *
 * Hỗ trợ: Windows (cmd), macOS (Terminal.app), Linux (gnome-terminal / xterm)
 */
const { spawn, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT_DIR    = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'Backend');
const MOBILE_DIR  = path.join(ROOT_DIR, 'Mobile');
const ML_DIR      = path.join(ROOT_DIR, 'MLSever');
const WEB_DIR     = path.join(ROOT_DIR, 'Website', 'engup');
const isWin       = process.platform === 'win32';

const ok  = (m) => console.log(`\x1b[32m[EngUp] ✔ ${m}\x1b[0m`);
const say = (m) => console.log(`\x1b[36m[EngUp]\x1b[0m ${m}`);
const err = (m) => { console.error(`\x1b[31m[EngUp] ✖ ${m}\x1b[0m`); process.exit(1); };

// ─── Kiểm tra thư mục tồn tại ────────────────────────────────────────────────
for (const [name, dir] of [['Backend', BACKEND_DIR], ['Mobile', MOBILE_DIR], ['MLSever', ML_DIR], ['Website', WEB_DIR]]) {
  if (!fs.existsSync(dir)) err(`Không tìm thấy thư mục ${name}: ${dir}`);
}

// ─── Hàm chạy lệnh đồng bộ (hiện output trực tiếp) ──────────────────────────
function runSync(cmd, args, cwd) {
  return spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true }).status === 0;
}

// Cần npm install nếu chưa có node_modules, hoặc package.json có thư viện chưa được cài
function needInstall(dir) {
  const nm = path.join(dir, 'node_modules');
  if (!fs.existsSync(nm)) return true;
  try {
    const pkg  = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.keys(deps).some((d) => !fs.existsSync(path.join(nm, d)));
  } catch {
    return true;
  }
}

// Website cần VITE_API_URL: tự tạo .env từ .env.example nếu chưa có
function ensureWebEnv(dir) {
  const env     = path.join(dir, '.env');
  const example = path.join(dir, '.env.example');
  if (!fs.existsSync(env) && fs.existsSync(example)) {
    fs.copyFileSync(example, env);
    ok('Website: đã tạo .env từ .env.example');
  }
}

// ─── 1. npm install Backend ───────────────────────────────────────────────────
if (needInstall(BACKEND_DIR)) {
  say('Cài thư viện Backend (npm install)...');
  if (!runSync('npm', ['install'], BACKEND_DIR)) err('npm install Backend thất bại.');
  ok('Backend: npm install xong.');
} else {
  ok('Backend: thư viện đã đủ, bỏ qua npm install.');
}

// ─── 2. npm install Mobile ────────────────────────────────────────────────────
if (needInstall(MOBILE_DIR)) {
  say('Cài thư viện Mobile (npm install, lần đầu có thể lâu)...');
  if (!runSync('npm', ['install'], MOBILE_DIR)) err('npm install Mobile thất bại.');
  ok('Mobile: npm install xong.');
} else {
  ok('Mobile: thư viện đã đủ, bỏ qua npm install.');
}

// ─── 3. npm install Website ───────────────────────────────────────────────────
if (needInstall(WEB_DIR)) {
  say('Cài thư viện Website (npm install)...');
  if (!runSync('npm', ['install'], WEB_DIR)) err('npm install Website thất bại.');
  ok('Website: npm install xong.');
} else {
  ok('Website: thư viện đã đủ, bỏ qua npm install.');
}
ensureWebEnv(WEB_DIR);

// ─── 4. Xây dựng lệnh khởi động cho mỗi terminal ────────────────────────────
//
// MLSever: toàn bộ setup (venv + pip + uvicorn) chạy BÊN TRONG cửa sổ mới
// để người dùng thấy tiến trình và không bị block terminal hiện tại.
//
const venvDir  = path.join(ML_DIR, '.venv');
const venvOk   = fs.existsSync(
  path.join(venvDir, isWin ? 'Scripts\\pip.exe' : 'bin/pip')
);
const reqInstalled = path.join(venvDir, '.req_installed');
const needPip  = !venvOk || !fs.existsSync(reqInstalled);

// Tất cả dùng dấu nháy kép vì thư mục có thể chứa khoảng trắng
let mlCmd;
if (isWin) {
  const pip      = `"${path.join(venvDir, 'Scripts', 'pip.exe')}"`;
  const uvicorn  = `"${path.join(venvDir, 'Scripts', 'uvicorn.exe')}"`;

  if (!venvOk) {
    // Tạo venv rồi cài rồi chạy
    mlCmd = `python -m venv .venv && ${pip} install -r requirements.txt && echo DONE > .venv\\.req_installed && ${uvicorn} app.main:app --reload --host 0.0.0.0 --port 8000`;
  } else if (needPip) {
    mlCmd = `${pip} install -r requirements.txt && echo DONE > .venv\\.req_installed && ${uvicorn} app.main:app --reload --host 0.0.0.0 --port 8000`;
  } else {
    mlCmd = `${uvicorn} app.main:app --reload --host 0.0.0.0 --port 8000`;
  }
} else {
  const pip     = path.join(venvDir, 'bin', 'pip');
  const uvicorn = path.join(venvDir, 'bin', 'uvicorn');

  if (!venvOk) {
    mlCmd = `python3 -m venv .venv && "${pip}" install -r requirements.txt && touch .venv/.req_installed && "${uvicorn}" app.main:app --reload --host 0.0.0.0 --port 8000`;
  } else if (needPip) {
    mlCmd = `"${pip}" install -r requirements.txt && touch .venv/.req_installed && "${uvicorn}" app.main:app --reload --host 0.0.0.0 --port 8000`;
  } else {
    mlCmd = `"${uvicorn}" app.main:app --reload --host 0.0.0.0 --port 8000`;
  }
}

const tasks = [
  { title: 'EngUp Backend', dir: BACKEND_DIR, cmd: 'npm run dev'  },
  { title: 'EngUp Mobile',  dir: MOBILE_DIR,  cmd: 'npm start'    },
  { title: 'EngUp MLSever', dir: ML_DIR,      cmd: mlCmd          },
  { title: 'EngUp Website', dir: WEB_DIR,     cmd: 'npm run dev -- --host' },
];

// ─── Hàm mở terminal mới ─────────────────────────────────────────────────────
const hasCmd = (bin) => spawnSync('which', [bin], { stdio: 'ignore', shell: true }).status === 0;

function launch({ title, dir, cmd }) {
  let child;

  if (isWin) {
    // start "<title>" /D "<dir>" cmd /k "<cmd>"  → cửa sổ cmd mới, giữ lại sau khi chạy
    child = spawn(
      'cmd.exe',
      ['/d', '/s', '/c', `start "${title}" /D "${dir}" cmd /k "${cmd}"`],
      { windowsVerbatimArguments: true, detached: true, stdio: 'ignore' }
    );
  } else if (process.platform === 'darwin') {
    const script = `cd "${dir}" && ${cmd}`.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    child = spawn(
      'osascript',
      [
        '-e', `tell application "Terminal" to do script "${script}"`,
        '-e', 'tell application "Terminal" to activate',
      ],
      { detached: true, stdio: 'ignore' }
    );
  } else {
    // Linux: thử lần lượt các terminal phổ biến
    const shellCmd = `cd "${dir}" && ${cmd}; exec bash`;
    const candidates = [
      ['gnome-terminal', ['--title', title, '--', 'bash', '-c', shellCmd]],
      ['konsole',        ['--new-tab', '-p', `tabtitle=${title}`, '-e', 'bash', '-c', shellCmd]],
      ['xfce4-terminal', ['--title', title, '-x', 'bash', '-c', shellCmd]],
      ['x-terminal-emulator', ['-e', 'bash', '-c', shellCmd]],
      ['xterm',          ['-T', title, '-e', 'bash', '-c', shellCmd]],
    ];
    const found = candidates.find(([bin]) => hasCmd(bin));
    if (!found) {
      err(`Không tìm thấy terminal nào. Hãy tự chạy:\n  cd "${dir}" && ${cmd}`);
      return;
    }
    child = spawn(found[0], found[1], { detached: true, stdio: 'ignore' });
  }

  child.on('error', (e) => console.error(`\x1b[31m[EngUp] Lỗi mở terminal "${title}": ${e.message}\x1b[0m`));
  child.unref();
  ok(`Đã mở terminal: ${title}`);
}

// ─── Chạy ─────────────────────────────────────────────────────────────────────
console.log(`\n\x1b[36m[EngUp]\x1b[0m Hệ điều hành: ${process.platform} | Thư mục gốc: ${ROOT_DIR}\n`);
tasks.forEach(launch);

console.log(`
\x1b[32m═══════════════════════════════════════════\x1b[0m
\x1b[32m  EngUp đã mở 4 terminal:\x1b[0m
    📦 Backend  → http://localhost:5000/api
    📱 Mobile   → Expo Go (quét QR)
    🤖 MLSever  → http://localhost:8000/docs
    🌐 Website  → http://localhost:5173  (admin@engup.test / Admin@123)
\x1b[32m═══════════════════════════════════════════\x1b[0m
`);