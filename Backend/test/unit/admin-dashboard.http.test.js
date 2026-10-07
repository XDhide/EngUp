/**
 * Test tầng HTTP của module admin-dashboard: route + JWT + phân quyền + validation +
 * định dạng response cho 3 nhóm endpoint (/admin/notifications, /admin/dashboard, /admin/subscriptions).
 * Dựng một Express app nhỏ, Repository được thay bằng bản giả lập nên KHÔNG cần MySQL.
 *
 * Chạy: npm run test:unit
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'unit-test-refresh-secret';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const repo = require('../../src/modules/admin-dashboard/admin-dashboard.Repository');
const { notificationsRouter, dashboardRouter, subscriptionsRouter } = require('../../src/modules/admin-dashboard/admin-dashboard.routes');
const errorMiddleware = require('../../src/common/middlewares/error.middleware');
const { generateAccessToken } = require('../../src/common/utils/token');

const original = { ...repo };
const adminToken = generateAccessToken({ id: 7, role: 'admin' });
const studentToken = generateAccessToken({ id: 8, role: 'student' });
const T0 = new Date('2026-09-01T00:00:00Z');

let server;
let baseUrl;
let originalConsoleError;
let fake;

before(async () => {
  originalConsoleError = console.error;
  console.error = () => {}; // error.middleware in stack trace mỗi lỗi -> tắt cho gọn

  const app = express();
  app.use(express.json());
  app.use('/api/admin/notifications', notificationsRouter);
  app.use('/api/admin/dashboard', dashboardRouter);
  app.use('/api/admin/subscriptions', subscriptionsRouter);
  app.use(errorMiddleware);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin`;
});

after(async () => {
  console.error = originalConsoleError;
  Object.assign(repo, original);
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  fake = { templates: [], plans: [], subscriptions: [], notifications: [], writes: [], sentArgs: [], subsArgs: [] };
  let nextId = 100;
  const TX = {};

  repo.withTransaction = async (cb) => cb(TX);
  repo.findTemplateById = async (id) => fake.templates.find((t) => t.id === id) || null;
  repo.findTemplateByName = async (name) => fake.templates.find((t) => t.name === name) || null;
  repo.createTemplate = async (data) => {
    fake.writes.push(['createTemplate', data]);
    return { id: nextId++, created_at: T0, ...data };
  };
  repo.updateTemplate = async (t, patch) => {
    fake.writes.push(['updateTemplate', t.id, patch]);
    return { ...t, ...patch };
  };
  repo.destroyTemplate = async (t) => fake.writes.push(['destroyTemplate', t.id]);
  repo.findSentNotifications = async (args) => {
    fake.sentArgs.push(args);
    return fake.notifications;
  };

  repo.countUsers = async () => 3;
  repo.findActiveUserIds = async () => [1, 2];
  repo.countTestAttempts = async () => ({ total: 4, submitted: 1 });
  repo.findRecentErrors = async () => [{ service: 'ml-service', level: 'error', message: 'x', created_at: T0 }];

  repo.findPlanById = async (id) => fake.plans.find((p) => p.id === id) || null;
  repo.createPlan = async (data) => {
    fake.writes.push(['createPlan', data]);
    return { id: nextId++, created_at: T0, ...data };
  };
  repo.updatePlan = async (p, patch) => {
    fake.writes.push(['updatePlan', p.id, patch]);
    return { ...p, ...patch };
  };
  repo.destroyPlan = async (p) => fake.writes.push(['destroyPlan', p.id]);
  repo.countSubscriptionsOfPlan = async (planId) => fake.subscriptions.filter((s) => s.plan_id === planId).length;
  repo.findSubscriptions = async (args) => {
    fake.subsArgs.push(args);
    return fake.subscriptions;
  };
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
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (err) {
    // Express trả HTML cho route không tồn tại (404 mặc định)
  }
  return { status: res.status, json };
}

const validTemplate = (o = {}) => ({
  name: 'welcome',
  title_template: 'Hi {{name}}',
  body_template: 'Body',
  type: 'system',
  ...o
});
const existingTemplate = (o = {}) => ({ id: 1, created_at: T0, ...validTemplate(), ...o });
const existingPlan = (o = {}) => ({ id: 1, name: 'Pro', price: '199000.00', duration_days: 30, features: null, created_at: T0, ...o });

// ====================================================================
// Xác thực & phân quyền — mọi endpoint
// ====================================================================

const ENDPOINTS = [
  ['POST', '/notifications/templates', validTemplate()],
  ['PUT', '/notifications/templates/1', { type: 'x' }],
  ['DELETE', '/notifications/templates/1'],
  ['GET', '/notifications/sent-history'],
  ['GET', '/dashboard/overview'],
  ['POST', '/subscriptions/plans', { name: 'Pro', price: 1, duration_days: 1 }],
  ['PUT', '/subscriptions/plans/1', { name: 'x' }],
  ['DELETE', '/subscriptions/plans/1'],
  ['GET', '/subscriptions']
];

test('không có token -> 401 (mọi endpoint)', async () => {
  for (const [method, path, body] of ENDPOINTS) {
    const { status, json } = await call(method, path, { body });
    assert.equal(status, 401, `${method} ${path}`);
    assert.equal(json.success, false);
  }
});

test('token student -> 403 (mọi endpoint) và không chạm repository', async () => {
  for (const [method, path, body] of ENDPOINTS) {
    const { status, json } = await call(method, path, { token: studentToken, body });
    assert.equal(status, 403, `${method} ${path}`);
    assert.equal(json.success, false);
  }
  assert.equal(fake.writes.length, 0);
  assert.equal(fake.sentArgs.length + fake.subsArgs.length, 0);
});

// ====================================================================
// Mẫu thông báo
// ====================================================================

test('POST /notifications/templates -> 201, data = template vừa tạo', async () => {
  const { status, json } = await call('POST', '/notifications/templates', { token: adminToken, body: validTemplate() });

  assert.equal(status, 201);
  assert.equal(json.success, true);
  assert.deepEqual(json.data, {
    id: 100,
    name: 'welcome',
    title_template: 'Hi {{name}}',
    body_template: 'Body',
    type: 'system',
    created_at: '2026-09-01T00:00:00.000Z'
  });
});

test('POST /notifications/templates: các chuỗi được trim', async () => {
  await call('POST', '/notifications/templates', {
    token: adminToken,
    body: validTemplate({ name: '  welcome  ', type: ' system ' })
  });
  assert.equal(fake.writes[0][1].name, 'welcome');
  assert.equal(fake.writes[0][1].type, 'system');
});

test('POST /notifications/templates: thiếu field / sai kiểu / rỗng / quá dài -> 400', async () => {
  const bad = [
    undefined,
    {},
    validTemplate({ name: undefined }),
    validTemplate({ name: '   ' }),
    validTemplate({ name: 'a'.repeat(101) }),
    validTemplate({ title_template: 'a'.repeat(256) }),
    validTemplate({ body_template: '' }),
    validTemplate({ body_template: 'a'.repeat(5001) }),
    validTemplate({ type: undefined }),
    validTemplate({ type: 'Review Due' }),
    validTemplate({ type: 'a'.repeat(51) }),
    validTemplate({ name: 123 }),
    validTemplate({ type: null })
  ];
  for (const body of bad) {
    const { status } = await call('POST', '/notifications/templates', { token: adminToken, body });
    assert.equal(status, 400, `body=${JSON.stringify(body)}`);
  }
  assert.equal(fake.writes.length, 0);
});

test('POST /notifications/templates: đúng biên (100 / 255 / 5000 / 50 ký tự) -> 201', async () => {
  const { status } = await call('POST', '/notifications/templates', {
    token: adminToken,
    body: validTemplate({
      name: 'a'.repeat(100),
      title_template: 'a'.repeat(255),
      body_template: 'a'.repeat(5000),
      type: 'a'.repeat(50)
    })
  });
  assert.equal(status, 201);
});

test('POST /notifications/templates: trùng tên -> 409', async () => {
  fake.templates.push(existingTemplate({ name: 'welcome' }));
  const { status, json } = await call('POST', '/notifications/templates', { token: adminToken, body: validTemplate() });
  assert.equal(status, 409);
  assert.equal(json.data, null);
});

test('PUT /notifications/templates/:id: id không hợp lệ -> 400', async () => {
  for (const bad of ['abc', '0', '-1', '1.5', '1e3']) {
    const { status } = await call('PUT', `/notifications/templates/${bad}`, { token: adminToken, body: { type: 'x' } });
    assert.equal(status, 400, `id='${bad}'`);
  }
});

test('PUT /notifications/templates/:id: body rỗng / field sai -> 400; không tồn tại -> 404', async () => {
  fake.templates.push(existingTemplate());
  for (const body of [undefined, {}, { unknown: 1 }, { type: 'BAD TYPE' }, { name: '' }]) {
    const { status } = await call('PUT', '/notifications/templates/1', { token: adminToken, body });
    assert.equal(status, 400, `body=${JSON.stringify(body)}`);
  }
  assert.equal((await call('PUT', '/notifications/templates/999', { token: adminToken, body: { type: 'x' } })).status, 404);
});

test('PUT /notifications/templates/:id thành công -> 200, data = template sau khi sửa', async () => {
  fake.templates.push(existingTemplate());

  const { status, json } = await call('PUT', '/notifications/templates/1', {
    token: adminToken,
    body: { title_template: 'New title' }
  });

  assert.equal(status, 200);
  assert.equal(json.data.title_template, 'New title');
  assert.equal(json.data.name, 'welcome');
});

test('DELETE /notifications/templates/:id -> 200 + data = template vừa xoá; xoá lại -> 404', async () => {
  fake.templates.push(existingTemplate());

  const ok = await call('DELETE', '/notifications/templates/1', { token: adminToken });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.id, 1);
  assert.deepEqual(fake.writes[0], ['destroyTemplate', 1]);

  fake.templates.length = 0;
  assert.equal((await call('DELETE', '/notifications/templates/1', { token: adminToken })).status, 404);
  assert.equal((await call('DELETE', '/notifications/templates/abc', { token: adminToken })).status, 400);
});

// ---------- GET /notifications/sent-history ----------

test('GET /notifications/sent-history -> 200, data = { history: [...] }', async () => {
  fake.notifications = [
    { id: 1, user_id: 5, title: 'T', body: 'B', type: 'system', is_read: true, created_at: T0 }
  ];

  const { status, json } = await call('GET', '/notifications/sent-history', { token: adminToken });

  assert.equal(status, 200);
  assert.deepEqual(json.data, {
    history: [{ id: 1, user_id: 5, title: 'T', body: 'B', type: 'system', is_read: true, created_at: '2026-09-01T00:00:00.000Z' }]
  });
});

test('GET /notifications/sent-history?from&to -> chuyển thành Date (to = cuối ngày UTC)', async () => {
  const { status } = await call('GET', '/notifications/sent-history?from=2026-09-01&to=2026-09-02', { token: adminToken });

  assert.equal(status, 200);
  assert.equal(fake.sentArgs[0].from.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(fake.sentArgs[0].to.toISOString(), '2026-09-02T23:59:59.999Z');
});

test('GET /notifications/sent-history: from/to sai, lặp hoặc from > to -> 400; from = to -> 200', async () => {
  const bad = ['from=abc', 'to=2026-02-30', 'from=', 'from=2026-09-01&from=2026-09-02', 'from=2026-09-05&to=2026-09-01'];
  for (const q of bad) {
    const { status } = await call('GET', `/notifications/sent-history?${q}`, { token: adminToken });
    assert.equal(status, 400, q);
  }
  assert.equal(fake.sentArgs.length, 0);
  assert.equal((await call('GET', '/notifications/sent-history?from=2026-09-05&to=2026-09-05', { token: adminToken })).status, 200);
});

// ====================================================================
// Dashboard
// ====================================================================

test('GET /dashboard/overview -> 200, data đúng 4 field', async () => {
  const { status, json } = await call('GET', '/dashboard/overview', { token: adminToken });

  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.deepEqual(Object.keys(json.data), ['total_users', 'daily_active_users', 'completion_rate', 'recent_errors']);
  assert.deepEqual(json.data, {
    total_users: 3,
    daily_active_users: 2,
    completion_rate: 25,
    recent_errors: [{ service: 'ml-service', level: 'error', message: 'x', created_at: '2026-09-01T00:00:00.000Z' }]
  });
  assert.equal(fake.writes.length, 0); // chỉ đọc
});

test('GET /dashboard/overview: lỗi repository -> 500, success=false, data=null', async () => {
  repo.countUsers = async () => {
    throw new Error('DB down');
  };
  const { status, json } = await call('GET', '/dashboard/overview', { token: adminToken });
  assert.equal(status, 500);
  assert.equal(json.success, false);
  assert.equal(json.data, null);
});

// ====================================================================
// Gói cước
// ====================================================================

const validPlan = (o = {}) => ({ name: 'Pro', price: 199000, duration_days: 30, features: ['no ads'], ...o });

test('POST /subscriptions/plans -> 201, data = gói vừa tạo (price là số)', async () => {
  const { status, json } = await call('POST', '/subscriptions/plans', { token: adminToken, body: validPlan() });

  assert.equal(status, 201);
  assert.deepEqual(json.data, {
    id: 100,
    name: 'Pro',
    price: 199000,
    duration_days: 30,
    features: ['no ads'],
    created_at: '2026-09-01T00:00:00.000Z'
  });
});

test('POST /subscriptions/plans: features là object / null / vắng mặt đều hợp lệ', async () => {
  for (const features of [{ ads: false }, null, undefined]) {
    const { status, json } = await call('POST', '/subscriptions/plans', { token: adminToken, body: validPlan({ features }) });
    assert.equal(status, 201);
    assert.deepEqual(json.data.features, features === undefined ? null : features);
  }
});

test('POST /subscriptions/plans: giá trị sai -> 400 và không ghi gì', async () => {
  const bad = [
    undefined,
    {},
    validPlan({ name: undefined }),
    validPlan({ name: '' }),
    validPlan({ name: 'a'.repeat(101) }),
    validPlan({ price: undefined }),
    validPlan({ price: -1 }),
    validPlan({ price: '100' }),
    validPlan({ price: 1.234 }),
    validPlan({ price: 100000000 }),
    validPlan({ price: null }),
    validPlan({ duration_days: undefined }),
    validPlan({ duration_days: 0 }),
    validPlan({ duration_days: 1.5 }),
    validPlan({ duration_days: '30' }),
    validPlan({ duration_days: 4294967296 }),
    validPlan({ features: 'text' }),
    validPlan({ features: 5 }),
    validPlan({ features: ['x'.repeat(10001)] })
  ];
  for (const body of bad) {
    const { status } = await call('POST', '/subscriptions/plans', { token: adminToken, body });
    assert.equal(status, 400, `body=${JSON.stringify(body)?.slice(0, 80)}`);
  }
  assert.equal(fake.writes.length, 0);
});

test('POST /subscriptions/plans: giá 0 và 99999999.99 và 2 chữ số thập phân -> 201', async () => {
  for (const price of [0, 99999999.99, 0.1, 19.99]) {
    const { status } = await call('POST', '/subscriptions/plans', { token: adminToken, body: validPlan({ price }) });
    assert.equal(status, 201, `price=${price}`);
  }
});

test('PUT /subscriptions/plans/:id: cập nhật từng phần -> 200; body rỗng -> 400; không tồn tại -> 404; id sai -> 400', async () => {
  fake.plans.push(existingPlan());

  const ok = await call('PUT', '/subscriptions/plans/1', { token: adminToken, body: { price: 250000 } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.price, 250000);
  assert.equal(ok.json.data.name, 'Pro');

  assert.equal((await call('PUT', '/subscriptions/plans/1', { token: adminToken, body: {} })).status, 400);
  assert.equal((await call('PUT', '/subscriptions/plans/1', { token: adminToken, body: { price: -5 } })).status, 400);
  assert.equal((await call('PUT', '/subscriptions/plans/999', { token: adminToken, body: { name: 'x' } })).status, 404);
  assert.equal((await call('PUT', '/subscriptions/plans/abc', { token: adminToken, body: { name: 'x' } })).status, 400);
});

test('DELETE /subscriptions/plans/:id: 200 + data = gói vừa xoá; đã có đăng ký -> 409; không tồn tại -> 404', async () => {
  fake.plans.push(existingPlan({ id: 1 }), existingPlan({ id: 2 }));
  fake.subscriptions.push({ id: 1, plan_id: 2 });

  const ok = await call('DELETE', '/subscriptions/plans/1', { token: adminToken });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.id, 1);

  const conflict = await call('DELETE', '/subscriptions/plans/2', { token: adminToken });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.json.data, null);
  assert.ok(!fake.writes.some((w) => w[0] === 'destroyPlan' && w[1] === 2));

  assert.equal((await call('DELETE', '/subscriptions/plans/999', { token: adminToken })).status, 404);
  assert.equal((await call('DELETE', '/subscriptions/plans/abc', { token: adminToken })).status, 400);
});

// ---------- GET /subscriptions ----------

test('GET /subscriptions -> 200, data = { subscriptions: [...] }', async () => {
  fake.subscriptions = [
    { id: 1, user_id: 5, plan_id: 2, status: 'active', start_date: '2026-09-01', end_date: '2026-10-01', created_at: T0 }
  ];

  const { status, json } = await call('GET', '/subscriptions', { token: adminToken });

  assert.equal(status, 200);
  assert.deepEqual(json.data, {
    subscriptions: [
      { id: 1, user_id: 5, plan_id: 2, status: 'active', start_date: '2026-09-01', end_date: '2026-10-01', created_at: '2026-09-01T00:00:00.000Z' }
    ]
  });
});

test('GET /subscriptions?user_id=&status= hợp lệ -> truyền xuống repository (user_id là số)', async () => {
  for (const status of ['active', 'expired', 'cancelled']) {
    const res = await call('GET', `/subscriptions?user_id=5&status=${status}`, { token: adminToken });
    assert.equal(res.status, 200, status);
  }
  assert.deepEqual(fake.subsArgs.map((a) => [a.user_id, a.status]), [[5, 'active'], [5, 'expired'], [5, 'cancelled']]);
});

test('GET /subscriptions: user_id / status không hợp lệ hoặc lặp -> 400', async () => {
  const bad = ['user_id=abc', 'user_id=0', 'user_id=-1', 'user_id=1.5', 'user_id=', 'user_id=1&user_id=2',
    'status=foo', 'status=ACTIVE', 'status=', 'status=active&status=expired'];
  for (const q of bad) {
    const { status } = await call('GET', `/subscriptions?${q}`, { token: adminToken });
    assert.equal(status, 400, q);
  }
  assert.equal(fake.subsArgs.length, 0);
});

test('GET /subscriptions/plans (không có endpoint đọc gói) -> không bị nhầm với GET /subscriptions', async () => {
  const { status } = await call('GET', '/subscriptions/plans', { token: adminToken });
  assert.equal(status, 404);
});
