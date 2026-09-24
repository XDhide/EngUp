/**
 * Test tầng HTTP của module admin-logs: route + JWT + phân quyền + validation +
 * định dạng response. Dựng một Express app nhỏ chỉ chứa router của module,
 * Repository được thay bằng bản giả lập nên KHÔNG cần MySQL.
 *
 * Chạy: npm run test:unit
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'unit-test-refresh-secret';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const repo = require('../../src/modules/admin-logs/admin-logs.Repository');
const router = require('../../src/modules/admin-logs/admin-logs.routes');
const errorMiddleware = require('../../src/common/middlewares/error.middleware');
const { generateAccessToken } = require('../../src/common/utils/token');

const original = { ...repo };
const adminToken = generateAccessToken({ id: 7, role: 'admin' });
const studentToken = generateAccessToken({ id: 8, role: 'student' });

let server;
let baseUrl;
let originalConsoleError;
let calls;
let errorRows;
let auditRows;

before(async () => {
  originalConsoleError = console.error;
  console.error = () => {}; // error.middleware in stack trace mỗi lỗi -> tắt cho gọn

  const app = express();
  app.use(express.json());
  app.use('/api/admin/logs', router);
  app.use(errorMiddleware);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/logs`;
});

after(async () => {
  console.error = originalConsoleError;
  Object.assign(repo, original);
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  calls = [];
  errorRows = [];
  auditRows = [];
  repo.findErrorLogs = async (args) => {
    calls.push(['findErrorLogs', args]);
    return errorRows;
  };
  repo.findAuditLogs = async (args) => {
    calls.push(['findAuditLogs', args]);
    return auditRows;
  };
});

async function call(path, { token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET', headers });
  return { status: res.status, json: await res.json() };
}

const errorRow = (o = {}) => ({
  id: 1,
  service: 'backend',
  level: 'error',
  message: 'Boom',
  stack_trace: 'secret stack',
  created_at: new Date('2026-09-01T00:00:00Z'),
  ...o
});

const auditRow = (o = {}) => ({
  id: 1,
  actor_id: 7,
  action: 'content.approve',
  target_type: 'reading_article',
  target_id: 100,
  detail: { secret: true },
  created_at: new Date('2026-09-01T00:00:00Z'),
  ...o
});

// ---------- Xác thực & phân quyền ----------

test('không có token -> 401 (cả 2 endpoint)', async () => {
  for (const path of ['/errors', '/audit']) {
    const { status, json } = await call(path);
    assert.equal(status, 401, path);
    assert.equal(json.success, false);
  }
});

test('token student -> 403 (cả 2 endpoint) và không chạm repository', async () => {
  for (const path of ['/errors', '/audit']) {
    const { status, json } = await call(path, { token: studentToken });
    assert.equal(status, 403, path);
    assert.equal(json.success, false);
  }
  assert.equal(calls.length, 0);
});

test('student gửi query sai vẫn nhận 403 (phân quyền chạy trước validation)', async () => {
  const { status } = await call('/errors?service=xxx', { token: studentToken });
  assert.equal(status, 403);
});

// ---------- GET /errors ----------

test('GET /errors -> 200, data = { logs: [{service, level, message, created_at}] }', async () => {
  errorRows = [errorRow()];

  const { status, json } = await call('/errors', { token: adminToken });

  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.deepEqual(json.data, {
    logs: [{ service: 'backend', level: 'error', message: 'Boom', created_at: '2026-09-01T00:00:00.000Z' }]
  });
});

test('GET /errors không có log -> 200, logs = []', async () => {
  const { status, json } = await call('/errors', { token: adminToken });
  assert.equal(status, 200);
  assert.deepEqual(json.data, { logs: [] });
});

test('GET /errors?service=... hợp lệ -> truyền xuống repository', async () => {
  for (const service of ['backend', 'ml-service']) {
    const { status } = await call(`/errors?service=${service}`, { token: adminToken });
    assert.equal(status, 200, service);
  }
  assert.deepEqual(calls.map(([, a]) => a.service), ['backend', 'ml-service']);
});

test('GET /errors?service=... không hợp lệ -> 400 và không chạm repository', async () => {
  for (const bad of ['foo', 'BACKEND', 'ml_service', '']) {
    const { status } = await call(`/errors?service=${bad}`, { token: adminToken });
    assert.equal(status, 400, `service='${bad}'`);
  }
  const dup = await call('/errors?service=backend&service=ml-service', { token: adminToken });
  assert.equal(dup.status, 400);
  assert.equal(calls.length, 0);
});

test('GET /errors?from&to dạng YYYY-MM-DD -> from = đầu ngày, to = cuối ngày (UTC)', async () => {
  const { status } = await call('/errors?from=2026-09-01&to=2026-09-02', { token: adminToken });

  assert.equal(status, 200);
  const [, args] = calls[0];
  assert.equal(args.from.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(args.to.toISOString(), '2026-09-02T23:59:59.999Z');
});

test('GET /errors?from&to dạng ISO 8601 (Z, offset, không múi giờ = UTC)', async () => {
  const q = new URLSearchParams({
    from: '2026-09-01T10:00:00Z',
    to: '2026-09-01T17:30:00+07:00'
  });
  assert.equal((await call(`/errors?${q}`, { token: adminToken })).status, 200);
  assert.equal(calls[0][1].from.toISOString(), '2026-09-01T10:00:00.000Z');
  assert.equal(calls[0][1].to.toISOString(), '2026-09-01T10:30:00.000Z');

  assert.equal((await call('/errors?from=2026-09-01T10:00:00', { token: adminToken })).status, 200);
  assert.equal(calls[1][1].from.toISOString(), '2026-09-01T10:00:00.000Z');
});

test('GET /errors: from / to sai định dạng hoặc ngày không tồn tại -> 400', async () => {
  const bad = ['abc', '', '2026-13-01', '2026-02-30', '2026-9-1', '01/09/2026', '2026-09-01T25:00:00Z', '1756684800'];
  for (const value of bad) {
    for (const key of ['from', 'to']) {
      const { status } = await call(`/errors?${key}=${encodeURIComponent(value)}`, { token: adminToken });
      assert.equal(status, 400, `${key}='${value}'`);
    }
  }
  const dup = await call('/errors?from=2026-09-01&from=2026-09-02', { token: adminToken });
  assert.equal(dup.status, 400);
  assert.equal(calls.length, 0);
});

test('GET /errors: from > to -> 400; from = to (cùng ngày) -> 200', async () => {
  assert.equal((await call('/errors?from=2026-09-05&to=2026-09-01', { token: adminToken })).status, 400);
  assert.equal((await call('/errors?from=2026-09-05&to=2026-09-05', { token: adminToken })).status, 200);
});

test('GET /errors: chỉ from hoặc chỉ to đều hợp lệ', async () => {
  assert.equal((await call('/errors?from=2026-09-01', { token: adminToken })).status, 200);
  assert.equal((await call('/errors?to=2026-09-01', { token: adminToken })).status, 200);
  assert.equal(calls[0][1].to, undefined);
  assert.equal(calls[1][1].from, undefined);
});

test('GET /errors: tham số lạ bị bỏ qua', async () => {
  assert.equal((await call('/errors?foo=bar', { token: adminToken })).status, 200);
});

test('GET /errors: lỗi repository -> 500, success=false, data=null', async () => {
  repo.findErrorLogs = async () => {
    throw new Error('DB down');
  };
  const { status, json } = await call('/errors', { token: adminToken });
  assert.equal(status, 500);
  assert.equal(json.success, false);
  assert.equal(json.data, null);
});

// ---------- GET /audit ----------

test('GET /audit -> 200, data = { logs: [{actor_id, action, target_type, target_id, created_at}] }', async () => {
  auditRows = [auditRow()];

  const { status, json } = await call('/audit', { token: adminToken });

  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.deepEqual(json.data, {
    logs: [
      {
        actor_id: 7,
        action: 'content.approve',
        target_type: 'reading_article',
        target_id: 100,
        created_at: '2026-09-01T00:00:00.000Z'
      }
    ]
  });
});

test('GET /audit?actor_id=&action= hợp lệ -> truyền xuống repository (actor_id là số, action đã trim)', async () => {
  const { status } = await call('/audit?actor_id=7&action=%20user.status.update%20', { token: adminToken });

  assert.equal(status, 200);
  assert.deepEqual(calls[0][1].actor_id, 7);
  assert.deepEqual(calls[0][1].action, 'user.status.update');
});

test('GET /audit: actor_id không hợp lệ -> 400', async () => {
  for (const bad of ['abc', '0', '-1', '1.5', '1e3', '', '99999999999999999999']) {
    const { status } = await call(`/audit?actor_id=${bad}`, { token: adminToken });
    assert.equal(status, 400, `actor_id='${bad}'`);
  }
  assert.equal((await call('/audit?actor_id=1&actor_id=2', { token: adminToken })).status, 400);
  assert.equal(calls.length, 0);
});

test('GET /audit: action rỗng / toàn khoảng trắng / > 100 ký tự / lặp -> 400; đúng 100 ký tự -> 200', async () => {
  for (const bad of ['', '%20%20', 'a'.repeat(101)]) {
    const { status } = await call(`/audit?action=${bad}`, { token: adminToken });
    assert.equal(status, 400, `action='${bad}'`);
  }
  assert.equal((await call('/audit?action=a&action=b', { token: adminToken })).status, 400);
  assert.equal(calls.length, 0);

  assert.equal((await call(`/audit?action=${'a'.repeat(100)}`, { token: adminToken })).status, 200);
});

test('GET /audit không có log -> 200, logs = []', async () => {
  const { status, json } = await call('/audit', { token: adminToken });
  assert.equal(status, 200);
  assert.deepEqual(json.data, { logs: [] });
});

test('GET /audit: lỗi repository -> 500, success=false, data=null', async () => {
  repo.findAuditLogs = async () => {
    throw new Error('DB down');
  };
  const { status, json } = await call('/audit', { token: adminToken });
  assert.equal(status, 500);
  assert.equal(json.success, false);
  assert.equal(json.data, null);
});
