/**
 * npm run app   (chạy ở thư mục ngoài cùng, cùng cấp với Backend và Mobile)
 * Mở 2 cửa sổ terminal riêng:
 *   1) API    -> Backend  : npm run dev   (nodemon)
 *   2) Mobile -> Mobile   : npm start     (expo start)
 * Hỗ trợ Windows, macOS, Linux.
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'Backend');
const MOBILE_DIR = path.join(ROOT_DIR, 'Mobile');

// Nếu chưa có node_modules thì tự npm install trước khi chạy
const withInstall = (dir, cmd) =>
  fs.existsSync(path.join(dir, 'node_modules')) ? cmd : `npm install && ${cmd}`;

const tasks = [
  { title: 'EngUp API', dir: BACKEND_DIR, cmd: withInstall(BACKEND_DIR, 'npm run dev') },
  { title: 'EngUp Mobile', dir: MOBILE_DIR, cmd: withInstall(MOBILE_DIR, 'npm start') },
];

const hasCmd = (bin) => spawnSync('which', [bin], { stdio: 'ignore' }).status === 0;

const launch = ({ title, dir, cmd }) => {
  if (!fs.existsSync(dir)) {
    console.error(`[app] Không tìm thấy thư mục: ${dir}`);
    return;
  }

  let child;

  if (process.platform === 'win32') {
    // start "<title>" /D "<dir>" cmd /k <lệnh>  -> mở cửa sổ cmd mới, giữ lại sau khi chạy
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
      ['konsole', ['--new-tab', '-p', `tabtitle=${title}`, '-e', 'bash', '-c', shellCmd]],
      ['xfce4-terminal', ['--title', title, '-x', 'bash', '-c', shellCmd]],
      ['x-terminal-emulator', ['-e', 'bash', '-c', shellCmd]],
      ['xterm', ['-T', title, '-e', 'bash', '-c', shellCmd]],
    ];
    const found = candidates.find(([bin]) => hasCmd(bin));
    if (!found) {
      console.error(`[app] Không tìm thấy terminal nào. Hãy tự chạy: cd "${dir}" && ${cmd}`);
      return;
    }
    child = spawn(found[0], found[1], { detached: true, stdio: 'ignore' });
  }

  child.on('error', (err) => console.error(`[app] Lỗi mở terminal "${title}":`, err.message));
  child.unref();
  console.log(`[app] Đã mở terminal: ${title}`);
};

console.log(`[app] Hệ điều hành: ${process.platform} | Thư mục gốc: ${ROOT_DIR}`);
tasks.forEach(launch);