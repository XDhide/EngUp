/**
 * Test tầng HTTP của module admin-approval: route + JWT + phân quyền + validation +
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

const repo = require('../../src/modules/admin-approval/admin-approval.Repository');
const router = require('../../src/modules/admin-approval/admin-approval.routes');
const errorMiddleware = require('../../src/common/middlewares/error.middleware');
const { generateAccessToken } = require('../../src/common/utils/token');

const original = { ...repo };
const adminToken = generateAccessToken({ id: 7, role: 'admin' });
const studentToken = generateAccessToken({ id: 8, role: 'student' });

let server;
let baseUrl;
let originalConsoleError;
let fake;

before(async () => {
  originalConsoleError = console.error;
  console.error = () => {}; // error.middleware in stack trace mỗi lỗi -> tắt cho gọn

  const app = express();
  app.use(express.json());
  app.use('/api/admin/content', router);
  app.use(errorMiddleware);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/content`;
});

after(async () => {
  console.error = originalConsoleError;
  Object.assign(repo, original);
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  fake = { queue: [], contents: new Set(), writes: [] };
  const TX = {};

  repo.withTransaction = async (cb) => cb(TX);
  repo.findPending = async ({ type } = {}) => {
    fake.writes.push(['findPending', type]);
    return fake.queue.filter((q) => q.status === 'pending' && (!type || q.content_type === type));
  };
  repo.findQueueItemForUpdate = async (id) => fake.queue.find((q) => q.id === id) || null;
  repo.contentExists = async (type, id) => fake.contents.has(`${type}:${id}`);
  repo.setContentApproved = async (type, id) => fake.writes.push(['setContentApproved', type, id]);
  repo.markQueueItemReviewed = async (item, payload) => fake.writes.push(['markQueueItemReviewed', item.id, payload]);
  repo.createAuditLog = async (log) => fake.writes.push(['createAuditLog', log.action]);
});

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, json: await res.json() };
}

const pendingItem = (o = {}) => ({
  id: 1,
  content_type: 'reading_article',
  content_id: 100,
  status: 'pending',
  created_at: new Date('2026-09-01T00:00:00Z'),
  ...o
});

// ---------- Xác thực & phân quyền ----------

test('không có token -> 401 (cả 3 endpoint)', async () => {
  for (const [method, path, body] of [
    ['GET', '/pending'],
    ['PUT', '/1/approve'],
    ['PUT', '/1/reject', { reject_reason: 'x' }]
  ]) {
    const { status, json } = await call(method, path, { body });
    assert.equal(status, 401, `${method} ${path}`);
    assert.equal(json.success, false);
  }
});

test('token student -> 403 (cả 3 endpoint) và không chạm repository', async () => {
  for (const [method, path, body] of [
    ['GET', '/pending'],
    ['PUT', '/1/approve'],
    ['PUT', '/1/reject', { reject_reason: 'x' }]
  ]) {
    const { status, json } = await call(method, path, { token: studentToken, body });
    assert.equal(status, 403, `${method} ${path}`);
    assert.equal(json.success, false);
  }
  assert.equal(fake.writes.length, 0);
});

// ---------- GET /pending ----------

test('GET /pending -> 200, data = { items: [{id, content_type, content_id, created_at}] }', async () => {
  fake.queue.push(pendingItem());

  const { status, json } = await call('GET', '/pending', { token: adminToken });

  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.deepEqual(json.data, {
    items: [{ id: 1, content_type: 'reading_article', content_id: 100, created_at: '2026-09-01T00:00:00.000Z' }]
  });
});

test('GET /pending?type=test_question -> chỉ trả loại đó', async () => {
  fake.queue.push(pendingItem({ id: 1 }));
  fake.queue.push(pendingItem({ id: 2, content_type: 'test_question', content_id: 5 }));

  const { status, json } = await call('GET', '/pending?type=test_question', { token: adminToken });

  assert.equal(status, 200);
  assert.deepEqual(json.data.items.map((i) => i.id), [2]);
});

test('GET /pending?type=... không hợp lệ -> 400', async () => {
  for (const bad of ['foo', 'READING_ARTICLE', '']) {
    const { status } = await call('GET', `/pending?type=${bad}`, { token: adminToken });
    assert.equal(status, 400, `type='${bad}'`);
  }
  const dup = await call('GET', '/pending?type=reading_article&type=test_question', { token: adminToken });
  assert.equal(dup.status, 400);
});

// ---------- PUT /:id/approve ----------

test('PUT /:id/approve với id không hợp lệ -> 400', async () => {
  for (const bad of ['abc', '0', '-1', '1.5', '1e3']) {
    const { status } = await call('PUT', `/${bad}/approve`, { token: adminToken });
    assert.equal(status, 400, `id='${bad}'`);
  }
  assert.equal(fake.writes.length, 0);
});

test('PUT /:id/approve thành công (không cần body) -> 200, data = null', async () => {
  fake.queue.push(pendingItem({ id: 3, content_id: 100 }));
  fake.contents.add('reading_article:100');

  const { status, json } = await call('PUT', '/3/approve', { token: adminToken });

  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data, null);
  assert.deepEqual(fake.writes, [
    ['setContentApproved', 'reading_article', 100],
    ['markQueueItemReviewed', 3, { status: 'approved', reviewedBy: 7 }],
    ['createAuditLog', 'content.approve']
  ]);
});

test('PUT /:id/approve: 404 khi không có yêu cầu, 409 khi đã xử lý', async () => {
  const notFound = await call('PUT', '/999/approve', { token: adminToken });
  assert.equal(notFound.status, 404);

  fake.queue.push(pendingItem({ id: 4, status: 'approved' }));
  const conflict = await call('PUT', '/4/approve', { token: adminToken });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.json.data, null);
});

// ---------- PUT /:id/reject ----------

test('PUT /:id/reject: thiếu / rỗng / sai kiểu reject_reason -> 400', async () => {
  fake.queue.push(pendingItem({ id: 5 }));

  const bodies = [undefined, {}, { reject_reason: '' }, { reject_reason: '    ' }, { reject_reason: 123 }, { reject_reason: null }];
  for (const body of bodies) {
    const { status } = await call('PUT', '/5/reject', { token: adminToken, body });
    assert.equal(status, 400, `body=${JSON.stringify(body)}`);
  }
  assert.equal(fake.writes.length, 0);
});

test('PUT /:id/reject: reject_reason > 500 ký tự -> 400, đúng 500 ký tự -> 200', async () => {
  fake.queue.push(pendingItem({ id: 6 }));

  const tooLong = await call('PUT', '/6/reject', { token: adminToken, body: { reject_reason: 'a'.repeat(501) } });
  assert.equal(tooLong.status, 400);

  const ok = await call('PUT', '/6/reject', { token: adminToken, body: { reject_reason: 'a'.repeat(500) } });
  assert.equal(ok.status, 200);
});

test('PUT /:id/reject thành công -> 200, data = null, lý do được trim, không đụng bảng nội dung', async () => {
  fake.queue.push(pendingItem({ id: 7 }));

  const { status, json } = await call('PUT', '/7/reject', {
    token: adminToken,
    body: { reject_reason: '  Nội dung sai ngữ pháp  ' }
  });

  assert.equal(status, 200);
  assert.equal(json.data, null);
  assert.deepEqual(fake.writes, [
    ['markQueueItemReviewed', 7, { status: 'rejected', reviewedBy: 7, rejectReason: 'Nội dung sai ngữ pháp' }],
    ['createAuditLog', 'content.reject']
  ]);
});

test('PUT /:id/reject: id không hợp lệ -> 400; không tồn tại -> 404; đã xử lý -> 409', async () => {
  const body = { reject_reason: 'x' };

  assert.equal((await call('PUT', '/abc/reject', { token: adminToken, body })).status, 400);
  assert.equal((await call('PUT', '/999/reject', { token: adminToken, body })).status, 404);

  fake.queue.push(pendingItem({ id: 8, status: 'rejected' }));
  assert.equal((await call('PUT', '/8/reject', { token: adminToken, body })).status, 409);
});
