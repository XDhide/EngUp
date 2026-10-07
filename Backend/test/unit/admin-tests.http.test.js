/**
 * Test tầng HTTP của module admin-tests: route + JWT + phân quyền + validation + shape response.
 * Service chạy thật, Repository là bản giả lập trong bộ nhớ -> KHÔNG cần MySQL.
 *
 * Chạy: npm run test:unit
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'unit-test-refresh-secret';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const repo = require('../../src/modules/admin-tests/admin-tests.Repository');
const router = require('../../src/modules/admin-tests/admin-tests.routes');
const errorMiddleware = require('../../src/common/middlewares/error.middleware');
const { generateAccessToken } = require('../../src/common/utils/token');

const original = { ...repo };
const adminToken = generateAccessToken({ id: 7, role: 'admin' });
const studentToken = generateAccessToken({ id: 8, role: 'student' });

let server;
let baseUrl;
let originalConsoleError;
let writes; // ghi nhận các lần repository bị gọi để ghi dữ liệu
let sets;
let questions;
let attempts;

before(async () => {
  originalConsoleError = console.error;
  console.error = () => {};

  const app = express();
  app.use(express.json());
  app.use('/api/admin/tests', router);
  app.use(errorMiddleware);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/tests`;
});

after(async () => {
  console.error = originalConsoleError;
  Object.assign(repo, original);
  await new Promise((resolve) => server.close(resolve));
});

function record(table, row) {
  return {
    ...row,
    async update(patch) {
      Object.assign(this, patch);
      return this;
    },
    async destroy() {
      writes.push(['destroy', table, this.id]);
    }
  };
}

beforeEach(() => {
  writes = [];
  sets = [record('sets', { id: 1, exam_type: 'IELTS', section: 'Reading', title: 'Set A', time_limit_minutes: 60, created_at: new Date('2026-09-01T00:00:00Z') })];
  questions = [
    record('questions', {
      id: 10, test_set_id: 1, question_text: '2+2?', question_type: 'multiple_choice',
      options: ['A. 3', 'B. 4'], correct_answer: 'B', audio_url: null, passage_text: null, order_index: 0, is_approved: true
    })
  ];
  attempts = [];
  let nextId = 100;

  repo.withTransaction = async (cb) => cb({});
  repo.findTestSetById = async (id) => sets.find((s) => s.id === id) || null;
  repo.createTestSet = async (data) => {
    writes.push(['createTestSet', data]);
    return record('sets', { id: nextId++, created_at: new Date('2026-09-24T00:00:00Z'), ...data });
  };
  repo.updateTestSet = async (s, patch) => s.update(patch);
  repo.destroyTestSet = async (s) => s.destroy();
  repo.countQuestionsOfTestSet = async () => questions.length;
  repo.findQuestionById = async (id) => questions.find((q) => q.id === id) || null;
  repo.createQuestion = async (data) => {
    writes.push(['createQuestion', data]);
    return record('questions', { id: nextId++, is_approved: true, ...data });
  };
  repo.updateQuestion = async (q, patch) => q.update(patch);
  repo.destroyQuestion = async (q) => q.destroy();
  repo.countAttemptsOfTestSet = async (id) => attempts.filter((a) => a.test_set_id === id).length;
  repo.findAttemptsOfTestSet = async (id) => attempts.filter((a) => a.test_set_id === id);
  repo.createAuditLog = async () => {};
});

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, json: await res.json() };
}

const validSet = { exam_type: 'TOEIC', section: 'Listening', title: 'New set', time_limit_minutes: 45 };
const validQuestion = {
  test_set_id: 1, question_text: 'Capital of France?', question_type: 'multiple_choice',
  options: ['A. Paris', 'B. Rome'], correct_answer: 'A', order_index: 2
};

// ---------- Xác thực & phân quyền ----------

const ALL_ENDPOINTS = [
  ['POST', '/test-sets', validSet],
  ['PUT', '/test-sets/1', { title: 'x' }],
  ['DELETE', '/test-sets/1'],
  ['POST', '/questions', validQuestion],
  ['PUT', '/questions/10', { question_text: 'x' }],
  ['DELETE', '/questions/10'],
  ['GET', '/attempts?test_set_id=1']
];

test('không token -> 401 với cả 7 endpoint', async () => {
  for (const [method, path, body] of ALL_ENDPOINTS) {
    const { status } = await call(method, path, { body });
    assert.equal(status, 401, `${method} ${path}`);
  }
});

test('token student -> 403 với cả 7 endpoint, không ghi gì', async () => {
  for (const [method, path, body] of ALL_ENDPOINTS) {
    const { status } = await call(method, path, { token: studentToken, body });
    assert.equal(status, 403, `${method} ${path}`);
  }
  assert.equal(writes.length, 0);
});

// ---------- POST/PUT/DELETE test-sets ----------

test('POST /test-sets hợp lệ -> 201, data = test_set', async () => {
  const { status, json } = await call('POST', '/test-sets', { token: adminToken, body: { ...validSet, title: '  New set  ' } });

  assert.equal(status, 201);
  assert.equal(json.success, true);
  assert.equal(json.data.title, 'New set'); // đã trim
  assert.equal(json.data.exam_type, 'TOEIC');
  assert.equal(json.data.time_limit_minutes, 45);
  assert.ok(json.data.id);
});

test('POST /test-sets sai dữ liệu -> 400', async () => {
  const bad = [
    undefined,
    {},
    { ...validSet, exam_type: 'GRE' },
    { ...validSet, exam_type: 'ielts' },
    { ...validSet, section: '' },
    { ...validSet, section: 'x'.repeat(51) },
    { ...validSet, title: '   ' },
    { ...validSet, title: 'x'.repeat(256) },
    { ...validSet, time_limit_minutes: 0 },
    { ...validSet, time_limit_minutes: -5 },
    { ...validSet, time_limit_minutes: 1.5 },
    { ...validSet, time_limit_minutes: '30' },
    { ...validSet, time_limit_minutes: 99999999999 }
  ];
  for (const body of bad) {
    const { status } = await call('POST', '/test-sets', { token: adminToken, body });
    assert.equal(status, 400, JSON.stringify(body));
  }
  assert.equal(writes.length, 0);
});

test('PUT /test-sets/:id cập nhật từng phần -> 200; body rỗng / sai kiểu -> 400', async () => {
  const ok = await call('PUT', '/test-sets/1', { token: adminToken, body: { title: 'Renamed' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.title, 'Renamed');
  assert.equal(ok.json.data.exam_type, 'IELTS');

  for (const body of [undefined, {}, { unknown: 1 }, { exam_type: 'GRE' }, { time_limit_minutes: 'abc' }]) {
    const { status } = await call('PUT', '/test-sets/1', { token: adminToken, body });
    assert.equal(status, 400, JSON.stringify(body));
  }
});

test('PUT/DELETE /test-sets/:id: id sai -> 400, không tồn tại -> 404', async () => {
  for (const bad of ['abc', '0', '-1', '1.5', '1e3']) {
    assert.equal((await call('PUT', `/test-sets/${bad}`, { token: adminToken, body: { title: 'x' } })).status, 400, bad);
    assert.equal((await call('DELETE', `/test-sets/${bad}`, { token: adminToken })).status, 400, bad);
  }
  assert.equal((await call('PUT', '/test-sets/999', { token: adminToken, body: { title: 'x' } })).status, 404);
  assert.equal((await call('DELETE', '/test-sets/999', { token: adminToken })).status, 404);
});

test('DELETE /test-sets/:id -> 200, data = test_set đã xoá; đề có lượt làm -> 409', async () => {
  const ok = await call('DELETE', '/test-sets/1', { token: adminToken });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.id, 1);
  assert.equal(ok.json.data.title, 'Set A');

  attempts.push({ test_set_id: 1, user_id: 5, status: 'submitted' });
  const conflict = await call('DELETE', '/test-sets/1', { token: adminToken });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.json.data, null);
});

// ---------- POST/PUT/DELETE questions ----------

test('POST /questions hợp lệ -> 201, data = question đủ field', async () => {
  const { status, json } = await call('POST', '/questions', { token: adminToken, body: validQuestion });

  assert.equal(status, 201);
  assert.deepEqual(Object.keys(json.data).sort(), [
    'audio_url', 'correct_answer', 'id', 'is_approved', 'options', 'order_index',
    'passage_text', 'question_text', 'question_type', 'test_set_id'
  ]);
  assert.equal(json.data.order_index, 2);
  assert.deepEqual(json.data.options, ['A. Paris', 'B. Rome']);
});

test('POST /questions: essay không cần options/correct_answer, order_index mặc định 0', async () => {
  const { status, json } = await call('POST', '/questions', {
    token: adminToken,
    body: { test_set_id: 1, question_text: 'Write about...', question_type: 'essay' }
  });
  assert.equal(status, 201);
  assert.equal(json.data.order_index, 0);
  assert.equal(json.data.options, null);
});

test('POST /questions sai dữ liệu -> 400', async () => {
  const bad = [
    undefined,
    {},
    { ...validQuestion, test_set_id: undefined },
    { ...validQuestion, test_set_id: 'abc' },
    { ...validQuestion, test_set_id: 0 },
    { ...validQuestion, question_text: '' },
    { ...validQuestion, question_type: 'true_false' },
    { ...validQuestion, options: 'A,B' },
    { ...validQuestion, options: ['A', ''] },
    { ...validQuestion, options: Array.from({ length: 11 }, (_, i) => `opt ${i}`) },
    { ...validQuestion, correct_answer: 5 },
    { ...validQuestion, correct_answer: 'x'.repeat(256) },
    { ...validQuestion, order_index: -1 },
    { ...validQuestion, order_index: 1.5 },
    { ...validQuestion, audio_url: 'x'.repeat(501) },
    // ràng buộc chéo (do service kiểm tra) cũng phải ra 400
    { ...validQuestion, options: ['Only one'] },
    { ...validQuestion, correct_answer: null },
    { test_set_id: 1, question_text: 'q', question_type: 'fill_blank' }
  ];
  for (const body of bad) {
    const { status } = await call('POST', '/questions', { token: adminToken, body });
    assert.equal(status, 400, JSON.stringify(body));
  }
  assert.equal(writes.length, 0);
});

test('POST /questions: test_set_id không tồn tại -> 404', async () => {
  const { status } = await call('POST', '/questions', { token: adminToken, body: { ...validQuestion, test_set_id: 999 } });
  assert.equal(status, 404);
});

test('PUT /questions/:id cập nhật từng phần -> 200; ràng buộc chéo -> 400; không tồn tại -> 404', async () => {
  const ok = await call('PUT', '/questions/10', { token: adminToken, body: { question_text: 'Changed', order_index: 5 } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.question_text, 'Changed');
  assert.equal(ok.json.data.order_index, 5);
  assert.deepEqual(ok.json.data.options, ['A. 3', 'B. 4']);

  assert.equal((await call('PUT', '/questions/10', { token: adminToken, body: {} })).status, 400);
  assert.equal((await call('PUT', '/questions/10', { token: adminToken, body: { options: ['only one'] } })).status, 400);
  assert.equal((await call('PUT', '/questions/abc', { token: adminToken, body: { question_text: 'x' } })).status, 400);
  assert.equal((await call('PUT', '/questions/999', { token: adminToken, body: { question_text: 'x' } })).status, 404);
});

test('DELETE /questions/:id -> 200, data = question đã xoá; xoá lại -> 404 khi không còn', async () => {
  const ok = await call('DELETE', '/questions/10', { token: adminToken });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.id, 10);
  assert.equal(ok.json.data.correct_answer, 'B');

  assert.equal((await call('DELETE', '/questions/999', { token: adminToken })).status, 404);
  assert.equal((await call('DELETE', '/questions/abc', { token: adminToken })).status, 400);
});

// ---------- GET /attempts ----------

test('GET /attempts: thiếu / sai test_set_id -> 400', async () => {
  for (const q of ['', '?test_set_id=', '?test_set_id=abc', '?test_set_id=0', '?test_set_id=-1', '?test_set_id=1.5', '?test_set_id=1&test_set_id=2']) {
    const { status } = await call('GET', `/attempts${q}`, { token: adminToken });
    assert.equal(status, 400, q);
  }
});

test('GET /attempts: đề không tồn tại -> 404', async () => {
  assert.equal((await call('GET', '/attempts?test_set_id=999', { token: adminToken })).status, 404);
});

test('GET /attempts -> 200, data = { attempts: [{user_id, score, band_score, status}], completion_rate }', async () => {
  attempts.push(
    { test_set_id: 1, user_id: 5, score: '80.00', band_score: '7.0', status: 'submitted', started_at: 'x', answers: [1] },
    { test_set_id: 1, user_id: 6, score: null, band_score: null, status: 'in_progress' }
  );

  const { status, json } = await call('GET', '/attempts?test_set_id=1', { token: adminToken });

  assert.equal(status, 200);
  assert.deepEqual(Object.keys(json.data).sort(), ['attempts', 'completion_rate']);
  assert.equal(json.data.completion_rate, 50);
  assert.deepEqual(json.data.attempts, [
    { user_id: 5, score: 80, band_score: 7, status: 'submitted' }, // không lộ answers/started_at
    { user_id: 6, score: null, band_score: null, status: 'in_progress' }
  ]);
});
