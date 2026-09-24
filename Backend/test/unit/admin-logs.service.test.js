/**
 * Unit test cho tầng service của module admin-logs.
 * Không cần MySQL: các hàm của Repository được thay bằng bản giả lập trong bộ nhớ.
 *
 * Chạy: npm run test:unit
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const repo = require('../../src/modules/admin-logs/admin-logs.Repository');
const service = require('../../src/modules/admin-logs/admin-logs.service');

const ADMIN = { id: 7, role: 'admin' };
const STUDENT = { id: 8, role: 'student' };

let calls; // nhật ký các lời gọi xuống repository
let errorRows;
let auditRows;
const original = { ...repo };

const errorRow = (o = {}) => ({
  id: 1,
  service: 'backend',
  level: 'error',
  message: 'Boom',
  stack_trace: 'Error: Boom\n  at x',
  created_at: new Date('2026-09-01T00:00:00Z'),
  ...o
});

const auditRow = (o = {}) => ({
  id: 1,
  actor_id: '7', // BIGINT có thể về dạng chuỗi
  action: 'content.approve',
  target_type: 'reading_article',
  target_id: '100',
  detail: { queue_id: 3 },
  created_at: new Date('2026-09-01T00:00:00Z'),
  ...o
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

test.after(() => Object.assign(repo, original));

// ---------- getErrorLogs ----------

test('getErrorLogs: student / thiếu user bị 403 và không chạm repository', async () => {
  await assert.rejects(service.getErrorLogs(STUDENT, {}), { statusCode: 403 });
  await assert.rejects(service.getErrorLogs(undefined, {}), { statusCode: 403 });
  assert.equal(calls.length, 0);
});

test('getErrorLogs: chỉ trả đúng 4 field {service, level, message, created_at} (không lộ stack_trace / id)', async () => {
  errorRows = [errorRow()];

  const result = await service.getErrorLogs(ADMIN, {});

  assert.deepEqual(Object.keys(result), ['logs']);
  assert.deepEqual(result.logs, [
    { service: 'backend', level: 'error', message: 'Boom', created_at: new Date('2026-09-01T00:00:00Z') }
  ]);
});

test('getErrorLogs: truyền service/from/to xuống repository kèm giới hạn MAX_LOGS', async () => {
  const from = new Date('2026-09-01T00:00:00Z');
  const to = new Date('2026-09-02T00:00:00Z');

  await service.getErrorLogs(ADMIN, { service: 'ml-service', from, to });

  assert.deepEqual(calls, [['findErrorLogs', { service: 'ml-service', from, to, limit: service.MAX_LOGS }]]);
});

test('getErrorLogs: không có bộ lọc -> repository nhận các trường undefined', async () => {
  await service.getErrorLogs(ADMIN);

  const [, args] = calls[0];
  assert.equal(args.service, undefined);
  assert.equal(args.from, undefined);
  assert.equal(args.to, undefined);
});

test('getErrorLogs: không có log -> logs = []', async () => {
  assert.deepEqual(await service.getErrorLogs(ADMIN, {}), { logs: [] });
});

test('getErrorLogs: lỗi từ repository được ném ra nguyên vẹn', async () => {
  repo.findErrorLogs = async () => {
    throw new Error('DB down');
  };
  await assert.rejects(service.getErrorLogs(ADMIN, {}), { message: 'DB down' });
});

// ---------- getAuditLogs ----------

test('getAuditLogs: student / thiếu user bị 403 và không chạm repository', async () => {
  await assert.rejects(service.getAuditLogs(STUDENT, {}), { statusCode: 403 });
  await assert.rejects(service.getAuditLogs(undefined, {}), { statusCode: 403 });
  assert.equal(calls.length, 0);
});

test('getAuditLogs: chỉ trả đúng 5 field, id dạng số, không lộ detail', async () => {
  auditRows = [auditRow()];

  const result = await service.getAuditLogs(ADMIN, {});

  assert.deepEqual(Object.keys(result), ['logs']);
  assert.deepEqual(result.logs, [
    {
      actor_id: 7,
      action: 'content.approve',
      target_type: 'reading_article',
      target_id: 100,
      created_at: new Date('2026-09-01T00:00:00Z')
    }
  ]);
});

test('getAuditLogs: truyền actor_id/action xuống repository kèm giới hạn MAX_LOGS', async () => {
  await service.getAuditLogs(ADMIN, { actor_id: 7, action: 'user.status.update' });

  assert.deepEqual(calls, [
    ['findAuditLogs', { actor_id: 7, action: 'user.status.update', limit: service.MAX_LOGS }]
  ]);
});

test('getAuditLogs: không có log -> logs = []', async () => {
  assert.deepEqual(await service.getAuditLogs(ADMIN, {}), { logs: [] });
});

test('getAuditLogs: lỗi từ repository được ném ra nguyên vẹn', async () => {
  repo.findAuditLogs = async () => {
    throw new Error('DB down');
  };
  await assert.rejects(service.getAuditLogs(ADMIN, {}), { message: 'DB down' });
});
