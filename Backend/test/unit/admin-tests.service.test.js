/**
 * Unit test tầng service của module admin-tests (CRUD đề thi, CRUD câu hỏi, thống kê lượt làm).
 * Repository được thay bằng bản giả lập trong bộ nhớ -> KHÔNG cần MySQL.
 *
 * Chạy: npm run test:unit
 */
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const repo = require('../../src/modules/admin-tests/admin-tests.Repository');
const service = require('../../src/modules/admin-tests/admin-tests.service');

const ADMIN = { id: 7, role: 'admin' };
const STUDENT = { id: 8, role: 'student' };
const original = { ...repo };

let db;
let audits;
let nextId;

// Bản ghi giả có .update()/.destroy() như model Sequelize (chỉ phần service dùng tới).
function makeRecord(table, row) {
  return {
    ...row,
    async update(patch) {
      Object.assign(this, patch);
      return this;
    },
    async destroy() {
      db[table] = db[table].filter((r) => r.id !== this.id);
    }
  };
}

function seedSet(overrides = {}) {
  const set = makeRecord('sets', {
    id: nextId++,
    exam_type: 'IELTS',
    section: 'Reading',
    title: 'Set A',
    time_limit_minutes: 60,
    created_at: new Date('2026-09-01T00:00:00Z'),
    ...overrides
  });
  db.sets.push(set);
  return set;
}

function seedQuestion(overrides = {}) {
  const q = makeRecord('questions', {
    id: nextId++,
    test_set_id: 1,
    question_text: '2+2?',
    question_type: 'multiple_choice',
    options: ['A. 3', 'B. 4'],
    correct_answer: 'B',
    audio_url: null,
    passage_text: null,
    order_index: 0,
    is_approved: true,
    ...overrides
  });
  db.questions.push(q);
  return q;
}

beforeEach(() => {
  db = { sets: [], questions: [], attempts: [] };
  audits = [];
  nextId = 1;
  const TX = { name: 'tx' };

  repo.withTransaction = async (cb) => cb(TX);
  repo.findTestSetById = async (id) => db.sets.find((s) => s.id === id) || null;
  repo.createTestSet = async (data) => {
    const set = makeRecord('sets', { id: nextId++, created_at: new Date('2026-09-24T00:00:00Z'), ...data });
    db.sets.push(set);
    return set;
  };
  repo.updateTestSet = async (set, patch) => set.update(patch);
  repo.destroyTestSet = async (set) => {
    await set.destroy();
    db.questions = db.questions.filter((q) => q.test_set_id !== set.id); // mô phỏng CASCADE
  };
  repo.countQuestionsOfTestSet = async (id) => db.questions.filter((q) => q.test_set_id === id).length;
  repo.findQuestionById = async (id) => db.questions.find((q) => q.id === id) || null;
  repo.createQuestion = async (data) => {
    const q = makeRecord('questions', { id: nextId++, is_approved: true, ...data });
    db.questions.push(q);
    return q;
  };
  repo.updateQuestion = async (q, patch) => q.update(patch);
  repo.destroyQuestion = async (q) => q.destroy();
  repo.countAttemptsOfTestSet = async (id) => db.attempts.filter((a) => a.test_set_id === id).length;
  repo.findAttemptsOfTestSet = async (id) => db.attempts.filter((a) => a.test_set_id === id);
  repo.createAuditLog = async (log) => audits.push(log);
});

after(() => Object.assign(repo, original));

const validSet = { exam_type: 'TOEIC', section: 'Listening', title: 'New set', time_limit_minutes: 45 };

// ---------- Phân quyền ----------

test('mọi hàm service từ chối non-admin bằng 403 và không ghi gì', async () => {
  seedSet();
  const calls = [
    () => service.createTestSet(STUDENT, validSet),
    () => service.updateTestSet(STUDENT, 1, { title: 'x' }),
    () => service.deleteTestSet(STUDENT, 1),
    () => service.createQuestion(STUDENT, { test_set_id: 1, question_text: 'q', question_type: 'essay' }),
    () => service.updateQuestion(STUDENT, 1, { question_text: 'x' }),
    () => service.deleteQuestion(STUDENT, 1),
    () => service.getAttemptStats(STUDENT, 1)
  ];
  for (const call of calls) await assert.rejects(call(), { statusCode: 403 });
  assert.equal(audits.length, 0);
  assert.equal(db.sets.length, 1);
});

// ---------- Đề thi ----------

test('createTestSet: tạo đề, chỉ nhận 4 field hợp lệ, ghi audit', async () => {
  const dto = await service.createTestSet(ADMIN, { ...validSet, id: 999, hack: true });

  assert.deepEqual(Object.keys(dto), ['id', 'exam_type', 'section', 'title', 'time_limit_minutes', 'created_at']);
  assert.notEqual(dto.id, 999); // client không được tự đặt id
  assert.equal(dto.title, 'New set');
  assert.equal(audits[0].action, 'test_set.create');
  assert.equal(audits[0].target_type, 'test_set');
  assert.equal(audits[0].actor_id, 7);
});

test('updateTestSet: cập nhật từng phần, giữ nguyên field không gửi, audit chỉ ghi field thay đổi', async () => {
  seedSet({ id: 1 });

  const dto = await service.updateTestSet(ADMIN, 1, { title: 'Renamed', section: 'Reading' });

  assert.equal(dto.title, 'Renamed');
  assert.equal(dto.exam_type, 'IELTS');
  assert.equal(dto.time_limit_minutes, 60);
  assert.deepEqual(Object.keys(audits[0].detail.changes), ['title']); // section không đổi
});

test('updateTestSet: không tồn tại -> 404', async () => {
  await assert.rejects(service.updateTestSet(ADMIN, 99, { title: 'x' }), { statusCode: 404 });
});

test('deleteTestSet: xoá được và trả snapshot đề; câu hỏi của đề bị xoá theo', async () => {
  seedSet({ id: 1, title: 'To delete' });
  seedQuestion({ test_set_id: 1 });
  seedQuestion({ test_set_id: 1 });

  const dto = await service.deleteTestSet(ADMIN, 1);

  assert.equal(dto.id, 1);
  assert.equal(dto.title, 'To delete');
  assert.equal(db.sets.length, 0);
  assert.equal(db.questions.length, 0);
  assert.equal(audits[0].action, 'test_set.delete');
  assert.equal(audits[0].detail.deleted_questions, 2);
});

test('deleteTestSet: đề đã có lượt làm bài -> 409, KHÔNG xoá gì', async () => {
  seedSet({ id: 1 });
  seedQuestion({ test_set_id: 1 });
  db.attempts.push({ test_set_id: 1, user_id: 5, status: 'submitted' });

  await assert.rejects(service.deleteTestSet(ADMIN, 1), { statusCode: 409 });
  assert.equal(db.sets.length, 1);
  assert.equal(db.questions.length, 1);
  assert.equal(audits.length, 0);
});

test('deleteTestSet: không tồn tại -> 404', async () => {
  await assert.rejects(service.deleteTestSet(ADMIN, 99), { statusCode: 404 });
});

// ---------- Câu hỏi: tạo ----------

test('createQuestion: test_set_id không tồn tại -> 404', async () => {
  await assert.rejects(
    service.createQuestion(ADMIN, { test_set_id: 99, question_text: 'q', question_type: 'essay' }),
    { statusCode: 404 }
  );
});

test('createQuestion: order_index mặc định 0, luôn trả đủ key (null cho field không gửi)', async () => {
  seedSet({ id: 1 });

  const dto = await service.createQuestion(ADMIN, { test_set_id: 1, question_text: 'Write an essay', question_type: 'essay' });

  assert.equal(dto.order_index, 0);
  assert.equal(dto.options, null);
  assert.equal(dto.correct_answer, null);
  assert.equal(dto.audio_url, null);
  assert.equal(dto.passage_text, null);
  assert.equal(dto.is_approved, true);
  assert.equal(audits[0].action, 'test_question.create');
});

const badQuestions = [
  ['multiple_choice thiếu options', { question_type: 'multiple_choice', correct_answer: 'A' }],
  ['multiple_choice chỉ 1 lựa chọn', { question_type: 'multiple_choice', options: ['A. x'], correct_answer: 'A' }],
  ['multiple_choice thiếu correct_answer', { question_type: 'multiple_choice', options: ['A. x', 'B. y'] }],
  ['fill_blank thiếu correct_answer', { question_type: 'fill_blank' }]
];
for (const [name, extra] of badQuestions) {
  test(`createQuestion: ${name} -> 400`, async () => {
    seedSet({ id: 1 });
    await assert.rejects(
      service.createQuestion(ADMIN, { test_set_id: 1, question_text: 'q', ...extra }),
      { statusCode: 400 }
    );
    assert.equal(db.questions.length, 0);
  });
}

test('createQuestion: essay / speaking_prompt không cần options và correct_answer', async () => {
  seedSet({ id: 1 });
  for (const type of ['essay', 'speaking_prompt']) {
    const dto = await service.createQuestion(ADMIN, { test_set_id: 1, question_text: 'q', question_type: type });
    assert.equal(dto.question_type, type);
  }
});

// ---------- Câu hỏi: sửa / xoá ----------

test('updateQuestion: cập nhật từng phần, giữ nguyên field không gửi', async () => {
  seedSet({ id: 1 });
  seedQuestion({ id: 10, test_set_id: 1 });

  const dto = await service.updateQuestion(ADMIN, 10, { question_text: '3+3?', correct_answer: 'A' });

  assert.equal(dto.question_text, '3+3?');
  assert.equal(dto.correct_answer, 'A');
  assert.deepEqual(dto.options, ['A. 3', 'B. 4']);
  assert.deepEqual(audits[0].detail.changed_fields.sort(), ['correct_answer', 'question_text']);
});

test('updateQuestion: kiểm tra ràng buộc trên bản ghi ĐÃ GỘP (đổi essay -> multiple_choice thiếu options -> 400)', async () => {
  seedSet({ id: 1 });
  seedQuestion({ id: 10, test_set_id: 1, question_type: 'essay', options: null, correct_answer: null });

  await assert.rejects(service.updateQuestion(ADMIN, 10, { question_type: 'multiple_choice' }), { statusCode: 400 });
  assert.equal(db.questions[0].question_type, 'essay'); // không bị sửa dở
});

test('updateQuestion: xoá correct_answer của câu multiple_choice -> 400', async () => {
  seedSet({ id: 1 });
  seedQuestion({ id: 10, test_set_id: 1 });

  await assert.rejects(service.updateQuestion(ADMIN, 10, { correct_answer: null }), { statusCode: 400 });
});

test('updateQuestion: chuyển sang đề khác — đề đích phải tồn tại', async () => {
  seedSet({ id: 1 });
  seedSet({ id: 2 });
  seedQuestion({ id: 10, test_set_id: 1 });

  await assert.rejects(service.updateQuestion(ADMIN, 10, { test_set_id: 99 }), { statusCode: 404 });

  const dto = await service.updateQuestion(ADMIN, 10, { test_set_id: 2 });
  assert.equal(dto.test_set_id, 2);
});

test('updateQuestion: không tồn tại -> 404', async () => {
  await assert.rejects(service.updateQuestion(ADMIN, 99, { question_text: 'x' }), { statusCode: 404 });
});

test('updateQuestion: không cho ghi is_approved / id qua payload', async () => {
  seedSet({ id: 1 });
  seedQuestion({ id: 10, test_set_id: 1 });

  const dto = await service.updateQuestion(ADMIN, 10, { question_text: 'x', is_approved: false, id: 500 });

  assert.equal(dto.id, 10);
  assert.equal(dto.is_approved, true);
});

test('deleteQuestion: xoá được và trả snapshot; không tồn tại -> 404', async () => {
  seedSet({ id: 1 });
  seedQuestion({ id: 10, test_set_id: 1 });

  const dto = await service.deleteQuestion(ADMIN, 10);
  assert.equal(dto.id, 10);
  assert.equal(db.questions.length, 0);
  assert.equal(audits[0].action, 'test_question.delete');

  await assert.rejects(service.deleteQuestion(ADMIN, 10), { statusCode: 404 });
});

// ---------- Thống kê ----------

test('getAttemptStats: đề không tồn tại -> 404', async () => {
  await assert.rejects(service.getAttemptStats(ADMIN, 99), { statusCode: 404 });
});

test('getAttemptStats: chưa có lượt nào -> attempts=[] và completion_rate=0 (không NaN)', async () => {
  seedSet({ id: 1 });
  assert.deepEqual(await service.getAttemptStats(ADMIN, 1), { attempts: [], completion_rate: 0 });
});

test('getAttemptStats: completion_rate = % lượt đã nộp; điểm DECIMAL dạng chuỗi được ép sang number', async () => {
  seedSet({ id: 1 });
  seedSet({ id: 2 });
  db.attempts.push(
    { test_set_id: 1, user_id: 5, score: '80.00', band_score: '7.0', status: 'submitted' },
    { test_set_id: 1, user_id: 6, score: '60.00', band_score: '5.5', status: 'submitted' },
    { test_set_id: 1, user_id: 5, score: null, band_score: null, status: 'in_progress' },
    { test_set_id: 2, user_id: 9, score: '10.00', band_score: '1.0', status: 'submitted' } // đề khác
  );

  const result = await service.getAttemptStats(ADMIN, 1);

  assert.equal(result.completion_rate, 66.67);
  assert.deepEqual(result.attempts, [
    { user_id: 5, score: 80, band_score: 7, status: 'submitted' },
    { user_id: 6, score: 60, band_score: 5.5, status: 'submitted' },
    { user_id: 5, score: null, band_score: null, status: 'in_progress' }
  ]);
});
