const { test } = require('node:test');
const assert = require('node:assert/strict');

const { normalizeReadingQuestion } = require('../../src/modules/reading/reading.questions.util');
const { localDateString, localTimeString, localDayRangeUtc, addDaysToDateString } = require('../../src/common/utils/appTime');
const streaks = require('../../src/modules/streaks/streaks.service');
const { normalizeOptions, buildHealth } = require('../../src/modules/admin-placement/admin-placement.service');

test('normalizeReadingQuestion: thêm tiền tố A./B., chữ cái đáp án viết hoa', () => {
  const q = normalizeReadingQuestion({ question_text: ' Q? ', options: ['x', 'B. y', 'z'], correct_answer: 'b' });
  assert.deepEqual(q.options, ['A. x', 'B. y', 'C. z']);
  assert.equal(q.correct_answer, 'B');
  assert.equal(q.question_text, 'Q?');
});

test('normalizeReadingQuestion: chấp nhận nguyên văn đáp án đúng', () => {
  assert.equal(normalizeReadingQuestion({ question_text: 'q', options: ['red', 'blue'], correct_answer: 'Blue' }).correct_answer, 'B');
});

for (const [name, body] of [
  ['thiếu nội dung', { options: ['a', 'b'], correct_answer: 'A' }],
  ['chỉ 1 đáp án', { question_text: 'q', options: ['a'], correct_answer: 'A' }],
  ['đáp án trùng', { question_text: 'q', options: ['a', 'A'], correct_answer: 'A' }],
  ['đáp án đúng ngoài phạm vi', { question_text: 'q', options: ['a', 'b'], correct_answer: 'D' }],
  ['thiếu đáp án đúng', { question_text: 'q', options: ['a', 'b'] }]
]) {
  test(`normalizeReadingQuestion: từ chối khi ${name}`, () => {
    assert.throws(() => normalizeReadingQuestion(body), { statusCode: 400 });
  });
}

test('appTime: 17:10 UTC = 00:10 hôm sau theo giờ Việt Nam', () => {
  const d = new Date('2026-10-06T17:10:00Z');
  assert.equal(localDateString(d, 'Asia/Ho_Chi_Minh'), '2026-10-07');
  assert.equal(localTimeString(d, 'Asia/Ho_Chi_Minh'), '00:10');
});

test('appTime: ngày địa phương VN đổi sang khoảng UTC đúng', () => {
  const { start, end } = localDayRangeUtc('2026-10-06', 'Asia/Ho_Chi_Minh');
  assert.equal(start.toISOString(), '2026-10-05T17:00:00.000Z');
  assert.equal(end.toISOString(), '2026-10-06T17:00:00.000Z');
  assert.equal(addDaysToDateString('2026-12-31', 1), '2027-01-01');
});

test('streak selfTest: mọi kịch bản đều đạt', () => {
  const bad = streaks.selfTest().filter((t) => !t.ok);
  assert.deepEqual(bad, []);
});

test('streak: học hôm nay rồi job chốt hôm qua không làm lùi last_active_date', () => {
  const r = streaks.computeStreakTransition({ current_streak: 3, longest_streak: 3, last_active_date: '2026-01-11' }, '2026-01-10', true);
  assert.equal(r.changed, false);
  assert.equal(r.last_active_date, '2026-01-11');
});

test('placement normalizeOptions: gán id a,b,c và map đáp án theo nội dung', () => {
  const r = normalizeOptions([{ text: 'go' }, { text: 'goes' }], 'goes');
  assert.deepEqual(r.options, [{ id: 'a', text: 'go' }, { id: 'b', text: 'goes' }]);
  assert.equal(r.correct_option_id, 'b');
  assert.throws(() => normalizeOptions([{ text: 'a' }, { text: 'a' }], 'a'), { statusCode: 400 });
  assert.throws(() => normalizeOptions([{ text: 'a' }, { text: 'b' }], 'z'), { statusCode: 400 });
});

test('placement buildHealth: cảnh báo khi thiếu câu hoặc thiếu mức', () => {
  const h = buildHealth([{ level: 'A1', is_active: true }, { level: 'A2', is_active: true }]);
  assert.equal(h.active_count, 2);
  assert.ok(h.warnings.length >= 2);
});
