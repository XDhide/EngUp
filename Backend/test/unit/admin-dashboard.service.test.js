/**
 * Unit test cho tầng service của module admin-dashboard
 * (mẫu thông báo, lịch sử gửi, dashboard tổng quan, gói cước / đăng ký).
 * Không cần MySQL: các hàm của Repository được thay bằng bản giả lập trong bộ nhớ.
 *
 * Chạy: npm run test:unit
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const repo = require('../../src/modules/admin-dashboard/admin-dashboard.Repository');
const service = require('../../src/modules/admin-dashboard/admin-dashboard.service');

const ADMIN = { id: 7, role: 'admin' };
const STUDENT = { id: 8, role: 'student' };
const original = { ...repo };
const TX = { name: 'fake-transaction' };

let db; // trạng thái giả lập
let calls; // nhật ký các lời gọi GHI dữ liệu
let nextId;

const T0 = new Date('2026-09-01T00:00:00Z');

function tpl(o = {}) {
  return { id: 1, name: 'welcome', title_template: 'Hi {{name}}', body_template: 'Body', type: 'system', created_at: T0, ...o };
}
function plan(o = {}) {
  return { id: 1, name: 'Pro', price: '199000.00', duration_days: 30, features: ['a'], created_at: T0, ...o };
}

beforeEach(() => {
  db = { templates: [], plans: [], subscriptions: [], notifications: [], sentArgs: null };
  calls = [];
  nextId = 100;

  repo.withTransaction = async (cb) => cb(TX);

  // ----- mẫu thông báo -----
  repo.findTemplateById = async (id, tx) => {
    assert.equal(tx, TX);
    return db.templates.find((t) => t.id === id) || null;
  };
  repo.findTemplateByName = async (name, tx) => {
    assert.equal(tx, TX);
    return db.templates.find((t) => t.name === name) || null;
  };
  repo.createTemplate = async (data, tx) => {
    assert.equal(tx, TX);
    calls.push(['createTemplate', data]);
    return { id: nextId++, created_at: T0, ...data };
  };
  repo.updateTemplate = async (template, patch, tx) => {
    assert.equal(tx, TX);
    calls.push(['updateTemplate', template.id, patch]);
    return { ...template, ...patch };
  };
  repo.destroyTemplate = async (template, tx) => {
    assert.equal(tx, TX);
    calls.push(['destroyTemplate', template.id]);
  };

  // ----- gói cước -----
  repo.findPlanById = async (id, tx) => {
    assert.equal(tx, TX);
    return db.plans.find((p) => p.id === id) || null;
  };
  repo.createPlan = async (data, tx) => {
    assert.equal(tx, TX);
    calls.push(['createPlan', data]);
    return { id: nextId++, created_at: T0, ...data };
  };
  repo.updatePlan = async (p, patch, tx) => {
    assert.equal(tx, TX);
    calls.push(['updatePlan', p.id, patch]);
    return { ...p, ...patch };
  };
  repo.destroyPlan = async (p, tx) => {
    assert.equal(tx, TX);
    calls.push(['destroyPlan', p.id]);
  };
  repo.countSubscriptionsOfPlan = async (planId, tx) => {
    assert.equal(tx, TX);
    return db.subscriptions.filter((s) => s.plan_id === planId).length;
  };
  repo.findSubscriptions = async (args) => {
    db.subsArgs = args;
    return db.subscriptions;
  };

  repo.findSentNotifications = async (args) => {
    db.sentArgs = args;
    return db.notifications;
  };

  // ----- thống kê -----
  db.stats = { users: 0, active: [], attempts: { total: 0, submitted: 0 }, errors: [] };
  repo.countUsers = async () => db.stats.users;
  repo.findActiveUserIds = async (range) => {
    db.activeRange = range;
    return db.stats.active;
  };
  repo.countTestAttempts = async () => db.stats.attempts;
  repo.findRecentErrors = async (limit) => {
    db.errorsLimit = limit;
    return db.stats.errors;
  };

  repo.createAuditLog = async (log, tx) => {
    assert.equal(tx, TX);
    calls.push(['createAuditLog', log]);
  };
});

test.after(() => Object.assign(repo, original));

const writes = () => calls.filter((c) => c[0] !== 'createAuditLog');
const audits = () => calls.filter((c) => c[0] === 'createAuditLog').map((c) => c[1]);

// ---------- Phân quyền: mọi hàm đều chặn student / thiếu user, không chạm repository ----------

const ALL_CALLS = [
  ['createTemplate', (u) => service.createTemplate(u, { name: 'x' })],
  ['updateTemplate', (u) => service.updateTemplate(u, 1, { name: 'x' })],
  ['deleteTemplate', (u) => service.deleteTemplate(u, 1)],
  ['getSentHistory', (u) => service.getSentHistory(u, {})],
  ['getOverview', (u) => service.getOverview(u)],
  ['createPlan', (u) => service.createPlan(u, { name: 'x' })],
  ['updatePlan', (u) => service.updatePlan(u, 1, { name: 'x' })],
  ['deletePlan', (u) => service.deletePlan(u, 1)],
  ['getSubscriptions', (u) => service.getSubscriptions(u, {})]
];

for (const [name, run] of ALL_CALLS) {
  test(`${name}: student / thiếu user bị 403 và không ghi gì`, async () => {
    await assert.rejects(run(STUDENT), { statusCode: 403 });
    await assert.rejects(run(undefined), { statusCode: 403 });
    assert.equal(calls.length, 0);
  });
}

// ---------- Mẫu thông báo ----------

test('createTemplate: lưu 4 field + audit log, trả về template vừa tạo', async () => {
  const result = await service.createTemplate(ADMIN, {
    name: 'welcome',
    title_template: 'Hi {{name}}',
    body_template: 'Body',
    type: 'system',
    id: 999, // bị bỏ qua (chống mass-assignment)
    is_admin: true
  });

  assert.deepEqual(result, {
    id: 100,
    name: 'welcome',
    title_template: 'Hi {{name}}',
    body_template: 'Body',
    type: 'system',
    created_at: T0
  });
  assert.deepEqual(calls[0], [
    'createTemplate',
    { name: 'welcome', title_template: 'Hi {{name}}', body_template: 'Body', type: 'system' }
  ]);
  assert.deepEqual(audits(), [
    {
      actor_id: 7,
      action: 'notification_template.create',
      target_type: 'notification_template',
      target_id: 100,
      detail: { name: 'welcome', type: 'system' }
    }
  ]);
});

test('createTemplate: trùng tên -> 409, không ghi gì', async () => {
  db.templates.push(tpl({ name: 'welcome' }));

  await assert.rejects(
    service.createTemplate(ADMIN, { name: 'welcome', title_template: 't', body_template: 'b', type: 'system' }),
    { statusCode: 409 }
  );
  assert.equal(calls.length, 0);
});

test('updateTemplate: không tồn tại -> 404', async () => {
  await assert.rejects(service.updateTemplate(ADMIN, 999, { type: 'x' }), { statusCode: 404 });
  assert.equal(calls.length, 0);
});

test('updateTemplate: cập nhật từng phần, audit chỉ ghi field thực sự đổi', async () => {
  db.templates.push(tpl({ id: 3 }));

  const result = await service.updateTemplate(ADMIN, 3, { name: 'welcome', type: 'review_due' });

  assert.equal(result.type, 'review_due');
  assert.equal(result.body_template, 'Body'); // field không gửi giữ nguyên
  assert.deepEqual(audits()[0].detail, { changes: { type: { from: 'system', to: 'review_due' } } });
  assert.equal(audits()[0].action, 'notification_template.update');
  assert.equal(audits()[0].target_id, 3);
});

test('updateTemplate: đổi sang tên đã thuộc mẫu khác -> 409; giữ nguyên tên của chính nó -> OK', async () => {
  db.templates.push(tpl({ id: 1, name: 'a' }), tpl({ id: 2, name: 'b' }));

  await assert.rejects(service.updateTemplate(ADMIN, 1, { name: 'b' }), { statusCode: 409 });
  assert.equal(calls.length, 0);

  await service.updateTemplate(ADMIN, 1, { name: 'a', type: 'system' });
  assert.equal(writes().length, 1);
});

test('deleteTemplate: không tồn tại -> 404', async () => {
  await assert.rejects(service.deleteTemplate(ADMIN, 999), { statusCode: 404 });
});

test('deleteTemplate: xoá + audit, trả về template vừa xoá', async () => {
  db.templates.push(tpl({ id: 4 }));

  const result = await service.deleteTemplate(ADMIN, 4);

  assert.equal(result.id, 4);
  assert.equal(result.name, 'welcome');
  assert.deepEqual(calls[0], ['destroyTemplate', 4]);
  assert.equal(audits()[0].action, 'notification_template.delete');
});

test('lỗi từ repository giữa chừng được ném ra nguyên vẹn (để transaction rollback)', async () => {
  db.templates.push(tpl({ id: 5 }));
  repo.createAuditLog = async () => {
    throw new Error('DB down');
  };
  await assert.rejects(service.deleteTemplate(ADMIN, 5), { message: 'DB down' });
});

// ---------- Lịch sử gửi ----------

test('getSentHistory: chỉ trả các field cần thiết, user_id dạng số, kèm giới hạn MAX_LIST_ROWS', async () => {
  const from = new Date('2026-09-01T00:00:00Z');
  const to = new Date('2026-09-02T00:00:00Z');
  db.notifications = [
    { id: 1, user_id: '5', title: 'T', body: 'B', type: 'review_due', is_read: 0, created_at: T0, secret: 'x' }
  ];

  const result = await service.getSentHistory(ADMIN, { from, to });

  assert.deepEqual(result, {
    history: [{ id: 1, user_id: 5, title: 'T', body: 'B', type: 'review_due', is_read: false, created_at: T0 }]
  });
  assert.deepEqual(db.sentArgs, { from, to, limit: service.MAX_LIST_ROWS });
});

test('getSentHistory: không có bản ghi -> history = []', async () => {
  assert.deepEqual(await service.getSentHistory(ADMIN, {}), { history: [] });
});

// ---------- Dashboard ----------

test('getOverview: tổng hợp đủ 4 field', async () => {
  db.stats = {
    users: 42,
    active: [1, 2, 3],
    attempts: { total: 8, submitted: 6 },
    errors: [{ service: 'backend', level: 'critical', message: 'Boom', created_at: T0, stack_trace: 'secret', id: 1 }]
  };

  const result = await service.getOverview(ADMIN);

  assert.deepEqual(result, {
    total_users: 42,
    daily_active_users: 3,
    completion_rate: 75,
    recent_errors: [{ service: 'backend', level: 'critical', message: 'Boom', created_at: T0 }]
  });
  assert.equal(db.errorsLimit, service.RECENT_ERRORS_LIMIT);
});

test('getOverview: chưa có dữ liệu -> mọi số = 0, recent_errors = []', async () => {
  assert.deepEqual(await service.getOverview(ADMIN), {
    total_users: 0,
    daily_active_users: 0,
    completion_rate: 0,
    recent_errors: []
  });
});

test('getOverview: completion_rate làm tròn 2 chữ số', async () => {
  db.stats.attempts = { total: 3, submitted: 2 };
  assert.equal((await service.getOverview(ADMIN)).completion_rate, 66.67);
});

test('getOverview: daily_active_users khử trùng lặp (id chuỗi/số)', async () => {
  db.stats.active = [1, '1', 2, 2];
  assert.equal((await service.getOverview(ADMIN)).daily_active_users, 2);
});

test('getOverview: "hôm nay" là ngày UTC [00:00, 24:00) của thời điểm hiện tại', async () => {
  await service.getOverview(ADMIN, { now: new Date('2026-09-24T23:59:59.999Z') });

  assert.equal(db.activeRange.from.toISOString(), '2026-09-24T00:00:00.000Z');
  assert.equal(db.activeRange.to.toISOString(), '2026-09-25T00:00:00.000Z');
});

test('getOverview: chỉ đọc — không gọi hàm ghi nào của repository', async () => {
  await service.getOverview(ADMIN);
  assert.equal(calls.length, 0);
});

// ---------- Gói cước ----------

test('createPlan: lưu gói + audit; features mặc định null; price trả về dạng số', async () => {
  const result = await service.createPlan(ADMIN, { name: 'Pro', price: 199000, duration_days: 30 });

  assert.deepEqual(result, { id: 100, name: 'Pro', price: 199000, duration_days: 30, features: null, created_at: T0 });
  assert.deepEqual(calls[0], ['createPlan', { name: 'Pro', price: 199000, duration_days: 30, features: null }]);
  assert.deepEqual(audits()[0], {
    actor_id: 7,
    action: 'subscription_plan.create',
    target_type: 'subscription_plan',
    target_id: 100,
    detail: { name: 'Pro', price: 199000, duration_days: 30 }
  });
});

test('updatePlan: không tồn tại -> 404', async () => {
  await assert.rejects(service.updatePlan(ADMIN, 999, { name: 'x' }), { statusCode: 404 });
});

test('updatePlan: price cũ dạng chuỗi DECIMAL được so sánh như số (không ghi thay đổi giả)', async () => {
  db.plans.push(plan({ id: 2, price: '199000.00' }));

  const result = await service.updatePlan(ADMIN, 2, { price: 199000, duration_days: 60 });

  assert.equal(result.price, 199000);
  assert.deepEqual(audits()[0].detail, { changes: { duration_days: { from: 30, to: 60 } } });
});

test('updatePlan: features có thể đặt lại về null', async () => {
  db.plans.push(plan({ id: 2 }));

  const result = await service.updatePlan(ADMIN, 2, { features: null });

  assert.equal(result.features, null);
  assert.deepEqual(audits()[0].detail, { changes: { features: { from: ['a'], to: null } } });
});

test('deletePlan: không tồn tại -> 404', async () => {
  await assert.rejects(service.deletePlan(ADMIN, 999), { statusCode: 404 });
});

test('deletePlan: gói đã có đăng ký -> 409 và không xoá (tránh CASCADE xoá đăng ký của học viên)', async () => {
  db.plans.push(plan({ id: 3 }));
  db.subscriptions.push({ id: 1, plan_id: 3 }, { id: 2, plan_id: 3 });

  await assert.rejects(service.deletePlan(ADMIN, 3), (err) => err.statusCode === 409 && /2 lượt đăng ký/.test(err.message));
  assert.equal(calls.length, 0);
});

test('deletePlan: gói chưa có đăng ký -> xoá + audit, trả về gói vừa xoá', async () => {
  db.plans.push(plan({ id: 4 }));

  const result = await service.deletePlan(ADMIN, 4);

  assert.equal(result.id, 4);
  assert.equal(result.price, 199000);
  assert.deepEqual(calls[0], ['destroyPlan', 4]);
  assert.equal(audits()[0].action, 'subscription_plan.delete');
});

// ---------- Đăng ký gói ----------

test('getSubscriptions: chỉ trả các field cần thiết, id dạng số, truyền bộ lọc + giới hạn xuống repository', async () => {
  db.subscriptions = [
    { id: 1, user_id: '5', plan_id: '2', status: 'active', start_date: '2026-09-01', end_date: '2026-10-01', created_at: T0, x: 1 }
  ];

  const result = await service.getSubscriptions(ADMIN, { user_id: 5, status: 'active' });

  assert.deepEqual(result, {
    subscriptions: [
      { id: 1, user_id: 5, plan_id: 2, status: 'active', start_date: '2026-09-01', end_date: '2026-10-01', created_at: T0 }
    ]
  });
  assert.deepEqual(db.subsArgs, { user_id: 5, status: 'active', limit: service.MAX_LIST_ROWS });
});

test('getSubscriptions: không có bản ghi -> subscriptions = []', async () => {
  assert.deepEqual(await service.getSubscriptions(ADMIN, {}), { subscriptions: [] });
});
