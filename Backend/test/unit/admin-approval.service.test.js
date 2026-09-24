/**
 * Unit test cho tầng service của module admin-approval.
 * Không cần MySQL: các hàm của Repository được thay bằng bản giả lập trong bộ nhớ.
 *
 * Chạy: npm run test:unit
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const repo = require('../../src/modules/admin-approval/admin-approval.Repository');
const service = require('../../src/modules/admin-approval/admin-approval.service');

const ADMIN = { id: 7, role: 'admin' };
const STUDENT = { id: 8, role: 'student' };

let db; // trạng thái giả lập
let calls; // nhật ký các lời gọi ghi dữ liệu
const original = { ...repo };

function queueItem(overrides = {}) {
  return {
    id: 1,
    content_type: 'reading_article',
    content_id: 100,
    status: 'pending',
    created_at: new Date('2026-09-01T00:00:00Z'),
    ...overrides
  };
}

beforeEach(() => {
  db = { queue: [], contents: new Set() };
  calls = [];

  const TX = { name: 'fake-transaction' };

  repo.withTransaction = async (cb) => cb(TX);
  repo.findPending = async ({ type } = {}) => {
    calls.push(['findPending', { type }]);
    return db.queue.filter((q) => q.status === 'pending' && (!type || q.content_type === type));
  };
  repo.findQueueItemForUpdate = async (id, tx) => {
    assert.equal(tx, TX, 'phải đọc dòng trong cùng transaction');
    return db.queue.find((q) => q.id === id) || null;
  };
  repo.contentExists = async (type, id, tx) => {
    assert.equal(tx, TX);
    return db.contents.has(`${type}:${id}`);
  };
  repo.setContentApproved = async (type, id, tx) => {
    assert.equal(tx, TX);
    calls.push(['setContentApproved', type, id]);
  };
  repo.markQueueItemReviewed = async (item, payload, tx) => {
    assert.equal(tx, TX);
    calls.push(['markQueueItemReviewed', item.id, payload]);
  };
  repo.createAuditLog = async (log, tx) => {
    assert.equal(tx, TX);
    calls.push(['createAuditLog', log]);
  };
});

test.after(() => Object.assign(repo, original));

// ---------- getPendingItems ----------

test('getPendingItems: student bị 403', async () => {
  await assert.rejects(service.getPendingItems(STUDENT, {}), { statusCode: 403 });
});

test('getPendingItems: thiếu user bị 403', async () => {
  await assert.rejects(service.getPendingItems(undefined, {}), { statusCode: 403 });
});

test('getPendingItems: chỉ trả đúng 4 field {id, content_type, content_id, created_at}', async () => {
  db.queue.push(queueItem({ reject_reason: 'x', reviewed_by: 1, status: 'pending' }));

  const result = await service.getPendingItems(ADMIN, {});

  assert.deepEqual(Object.keys(result), ['items']);
  assert.deepEqual(result.items, [
    {
      id: 1,
      content_type: 'reading_article',
      content_id: 100,
      created_at: new Date('2026-09-01T00:00:00Z')
    }
  ]);
});

test('getPendingItems: truyền bộ lọc type xuống repository', async () => {
  db.queue.push(queueItem({ id: 1, content_type: 'reading_article' }));
  db.queue.push(queueItem({ id: 2, content_type: 'test_question', content_id: 5 }));

  const result = await service.getPendingItems(ADMIN, { type: 'test_question' });

  assert.deepEqual(calls[0], ['findPending', { type: 'test_question' }]);
  assert.deepEqual(result.items.map((i) => i.id), [2]);
});

test('getPendingItems: hàng chờ rỗng -> items = []', async () => {
  const result = await service.getPendingItems(ADMIN, {});
  assert.deepEqual(result, { items: [] });
});

// ---------- approveContent ----------

test('approveContent: student bị 403 và không ghi gì', async () => {
  await assert.rejects(service.approveContent(STUDENT, 1), { statusCode: 403 });
  assert.equal(calls.length, 0);
});

test('approveContent: queue id không tồn tại -> 404', async () => {
  await assert.rejects(service.approveContent(ADMIN, 999), { statusCode: 404 });
  assert.equal(calls.length, 0);
});

for (const status of ['approved', 'rejected']) {
  test(`approveContent: yêu cầu đã '${status}' -> 409, không ghi gì`, async () => {
    db.queue.push(queueItem({ status }));
    db.contents.add('reading_article:100');

    await assert.rejects(service.approveContent(ADMIN, 1), { statusCode: 409 });
    assert.equal(calls.length, 0);
  });
}

test('approveContent: nội dung gốc đã bị xoá -> 404, không ghi gì', async () => {
  db.queue.push(queueItem());

  await assert.rejects(service.approveContent(ADMIN, 1), { statusCode: 404 });
  assert.equal(calls.length, 0);
});

for (const [type, contentId] of [
  ['reading_article', 100],
  ['test_question', 55]
]) {
  test(`approveContent (${type}): set is_approved trên bảng nội dung + cập nhật queue + audit`, async () => {
    db.queue.push(queueItem({ id: 3, content_type: type, content_id: contentId }));
    db.contents.add(`${type}:${contentId}`);

    const result = await service.approveContent(ADMIN, 3);

    assert.equal(result, null);
    assert.deepEqual(calls, [
      ['setContentApproved', type, contentId],
      ['markQueueItemReviewed', 3, { status: 'approved', reviewedBy: 7 }],
      [
        'createAuditLog',
        {
          actor_id: 7,
          action: 'content.approve',
          target_type: type,
          target_id: contentId,
          detail: { queue_id: 3 }
        }
      ]
    ]);
  });
}

test('approveContent: lỗi giữa chừng được ném ra nguyên vẹn (để transaction rollback)', async () => {
  db.queue.push(queueItem());
  db.contents.add('reading_article:100');
  repo.markQueueItemReviewed = async () => {
    throw new Error('DB down');
  };

  await assert.rejects(service.approveContent(ADMIN, 1), { message: 'DB down' });
});

// ---------- rejectContent ----------

test('rejectContent: student bị 403', async () => {
  await assert.rejects(service.rejectContent(STUDENT, 1, 'lý do'), { statusCode: 403 });
  assert.equal(calls.length, 0);
});

test('rejectContent: queue id không tồn tại -> 404', async () => {
  await assert.rejects(service.rejectContent(ADMIN, 999, 'lý do'), { statusCode: 404 });
});

for (const status of ['approved', 'rejected']) {
  test(`rejectContent: yêu cầu đã '${status}' -> 409`, async () => {
    db.queue.push(queueItem({ status }));

    await assert.rejects(service.rejectContent(ADMIN, 1, 'lý do'), { statusCode: 409 });
    assert.equal(calls.length, 0);
  });
}

test('rejectContent: lưu status=rejected + lý do + audit, KHÔNG đụng vào bảng nội dung', async () => {
  db.queue.push(queueItem({ id: 4, content_type: 'test_question', content_id: 9 }));

  const result = await service.rejectContent(ADMIN, 4, 'Sai đáp án');

  assert.equal(result, null);
  assert.deepEqual(calls, [
    ['markQueueItemReviewed', 4, { status: 'rejected', reviewedBy: 7, rejectReason: 'Sai đáp án' }],
    [
      'createAuditLog',
      {
        actor_id: 7,
        action: 'content.reject',
        target_type: 'test_question',
        target_id: 9,
        detail: { queue_id: 4, reject_reason: 'Sai đáp án' }
      }
    ]
  ]);
  assert.ok(!calls.some((c) => c[0] === 'setContentApproved'));
});

test('rejectContent: vẫn từ chối được khi nội dung gốc đã bị xoá (dọn hàng chờ)', async () => {
  db.queue.push(queueItem({ id: 5 }));

  await service.rejectContent(ADMIN, 5, 'Nội dung đã xoá');

  assert.equal(calls[0][0], 'markQueueItemReviewed');
});
