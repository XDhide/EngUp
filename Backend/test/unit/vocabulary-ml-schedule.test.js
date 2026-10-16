const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getMlNextReviewAt } = require('../../src/modules/vocabulary/vocabulary.service');

test('getMlNextReviewAt: dùng lịch khi có dự đoán từ model', () => {
  const nextReviewAt = new Date('2026-10-10T08:00:00.000Z');
  assert.equal(
    getMlNextReviewAt({ used_fallback_sm2: false, next_review_at: nextReviewAt }),
    nextReviewAt
  );
});

test('getMlNextReviewAt: không thay lịch SM-2 nếu ML đang fallback hoặc thiếu kết quả', () => {
  const nextReviewAt = new Date('2026-10-10T08:00:00.000Z');
  assert.equal(getMlNextReviewAt(null), null);
  assert.equal(getMlNextReviewAt({ used_fallback_sm2: true, next_review_at: nextReviewAt }), null);
  assert.equal(getMlNextReviewAt({ next_review_at: nextReviewAt }), null);
});
