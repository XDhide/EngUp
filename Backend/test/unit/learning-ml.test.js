const { test } = require('node:test');
const assert = require('node:assert/strict');
const { gradeOf } = require('../../src/modules/learning-paths/learning-paths.service');
const { auc, metrics, judge } = require('../../src/modules/admin-system/ml-tests');

test('gradeOf: các mức đánh giá hoàn thiện lộ trình', () => {
  assert.equal(gradeOf(0, 0, 0).key, 'empty');
  assert.equal(gradeOf(0, 0, 10).key, 'not_started');
  assert.equal(gradeOf(40, 30, 10).key, 'in_progress');
  assert.equal(gradeOf(100, 90, 10).key, 'excellent');
  assert.equal(gradeOf(100, 65, 10).key, 'good');
  assert.equal(gradeOf(100, 20, 10).key, 'completed');
});

test('auc: phân biệt hoàn hảo = 1, ngẫu nhiên = 0.5, đảo ngược = 0', () => {
  assert.equal(auc([{ p: 0.9, y: 1 }, { p: 0.8, y: 1 }, { p: 0.2, y: 0 }, { p: 0.1, y: 0 }]), 1);
  assert.equal(auc([{ p: 0.5, y: 1 }, { p: 0.5, y: 0 }]), 0.5);
  assert.equal(auc([{ p: 0.1, y: 1 }, { p: 0.9, y: 0 }]), 0);
  assert.equal(auc([{ p: 0.1, y: 1 }]), null);
});

test('metrics + judge: model tốt được đánh giá ok, model vô dụng bị fail', () => {
  const good = [];
  for (let i = 0; i < 200; i++) good.push({ p: i % 2 ? 0.95 : 0.05, y: i % 2 ? 1 : 0, naive: 0.5 });
  const mg = metrics(good);
  assert.equal(mg.accuracy, 1);
  assert.equal(judge(mg).status, 'ok');

  const bad = [];
  for (let i = 0; i < 200; i++) bad.push({ p: 0.95, y: i % 2, naive: 0.5 });
  assert.equal(judge(metrics(bad)).status, 'fail');
});
