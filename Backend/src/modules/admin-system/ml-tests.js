const { ReviewLog } = require('../../common/models');

const ML_URL = () => (process.env.ML_SERVICE_URL || '').replace(/\/+$/, '');
const RECALLED = new Set(['hard', 'good', 'easy']);
const DAY = 86400000;
const BASE = Date.UTC(2026, 0, 1, 8, 0, 0);

async function mlJson(path, { method = 'GET', body, timeout = 120000 } = {}) {
  let res;
  try {
    res = await fetch(`${ML_URL()}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout)
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error(`ML server không phản hồi trong ${Math.round(timeout / 1000)} giây (${path}). Kiểm tra MLSever có đang chạy và còn tài nguyên không`);
    }
    throw new Error(`Không kết nối được ML server (${path}): ${err.message}`);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`ML trả HTTP ${res.status}`);
  return json;
}

async function batch(items) {
  const out = [];
  let version = null;
  for (let i = 0; i < items.length; i += 250) {
    const chunk = items.slice(i, i + 250);
    const json = await mlJson('/predict/batch', { method: 'POST', body: { items: chunk } });
    out.push(...json.data.predictions);
    version = json.data.model_version;
  }
  return { predictions: out, version };
}

const ev = (daysFromBase, result = 'good') => ({ result, response_time_ms: 1500, reviewed_at: new Date(BASE + daysFromBase * DAY).toISOString() });
const asOf = (days) => new Date(BASE + days * DAY).toISOString();

function auc(pairs) {
  const pos = pairs.filter((p) => p.y === 1);
  const neg = pairs.filter((p) => p.y === 0);
  if (!pos.length || !neg.length) return null;
  const sorted = [...pairs].sort((a, b) => a.p - b.p);
  const ranks = new Array(sorted.length);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].p === sorted[i].p) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = avg;
    i = j + 1;
  }
  let posRankSum = 0;
  sorted.forEach((s, idx) => { if (s.y === 1) posRankSum += ranks[idx]; });
  return (posRankSum - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length);
}

function metrics(pairs) {
  const n = pairs.length;
  if (!n) return null;
  const base = pairs.reduce((s, p) => s + p.y, 0) / n;
  const brier = pairs.reduce((s, p) => s + (p.p - p.y) ** 2, 0) / n;
  const baseBrier = pairs.reduce((s, p) => s + (base - p.y) ** 2, 0) / n;
  const naiveBrier = pairs.reduce((s, p) => s + (p.naive - p.y) ** 2, 0) / n;
  const accuracy = pairs.filter((p) => (p.p >= 0.5 ? 1 : 0) === p.y).length / n;
  const naiveAccuracy = pairs.filter((p) => (p.naive >= 0.5 ? 1 : 0) === p.y).length / n;
  const majority = Math.max(base, 1 - base);
  const bins = [];
  for (let b = 0; b < 10; b++) {
    const lo = b / 10;
    const hi = (b + 1) / 10;
    const inBin = pairs.filter((p) => p.p >= lo && (b === 9 ? p.p <= hi : p.p < hi));
    if (inBin.length) {
      bins.push({
        range: `${Math.round(lo * 100)}-${Math.round(hi * 100)}%`,
        n: inBin.length,
        predicted: Number((inBin.reduce((s, p) => s + p.p, 0) / inBin.length).toFixed(3)),
        actual: Number((inBin.reduce((s, p) => s + p.y, 0) / inBin.length).toFixed(3))
      });
    }
  }
  const calibrationGap = bins.reduce((s, b) => s + Math.abs(b.predicted - b.actual) * b.n, 0) / n;
  const a = auc(pairs);
  return {
    n,
    recall_rate: Number(base.toFixed(3)),
    accuracy: Number(accuracy.toFixed(3)),
    majority_baseline_accuracy: Number(majority.toFixed(3)),
    naive_accuracy: Number(naiveAccuracy.toFixed(3)),
    brier: Number(brier.toFixed(4)),
    constant_baseline_brier: Number(baseBrier.toFixed(4)),
    naive_brier: Number(naiveBrier.toFixed(4)),
    auc: a === null ? null : Number(a.toFixed(3)),
    calibration_error: Number(calibrationGap.toFixed(3)),
    bins
  };
}

function judge(m) {
  if (!m) return { status: 'info', message: 'Chưa đủ dữ liệu' };
  const good = m.auc !== null && m.auc >= 0.65 && m.brier <= m.constant_baseline_brier;
  const poor = (m.auc !== null && m.auc < 0.55) || m.brier > m.constant_baseline_brier * 1.1;
  if (good && m.calibration_error <= 0.12) return { status: 'ok', message: 'Dự đoán phân biệt tốt từ nhớ/quên và xác suất khá sát thực tế' };
  if (poor) return { status: 'fail', message: 'Dự đoán kém hơn hoặc gần như không hơn việc đoán theo tỉ lệ trung bình' };
  return { status: 'warn', message: 'Dự đoán có giá trị nhưng độ chính xác/hiệu chỉnh chưa cao' };
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function goldenTests() {
  const strong = [ev(0), ev(2), ev(6), ev(14), ev(30), ev(60)];
  const weak = [ev(0, 'again'), ev(1, 'again'), ev(2, 'hard'), ev(3, 'again'), ev(4, 'again'), ev(5, 'hard')];
  const mid = [ev(0), ev(1), ev(3)];
  const defs = [
    { key: 'decay', name: 'Càng lâu không ôn, xác suất nhớ càng giảm', items: [0.04, 1, 7, 30, 120].map((d) => ({ review_history: mid, as_of: asOf(3 + d) })),
      check: (p) => ({ pass: p.every((x, i) => i === 0 || x.recall_probability <= p[i - 1].recall_probability + 0.01), detail: p.map((x) => `${Math.round(x.recall_probability * 100)}%`).join(' → ') + ' (sau 1 giờ, 1, 7, 30, 120 ngày)' }) },
    { key: 'decay_size', name: 'Suy giảm có ý nghĩa: sau 30 ngày không ôn phải thấp hơn ≥ 5 điểm % so với ngay sau khi ôn', items: [{ review_history: mid, as_of: asOf(3.04) }, { review_history: mid, as_of: asOf(33) }],
      check: (p) => { const drop = (p[0].recall_probability - p[1].recall_probability) * 100; return { pass: drop >= 5, detail: `${Math.round(p[0].recall_probability * 100)}% → ${Math.round(p[1].recall_probability * 100)}% (giảm ${drop.toFixed(1)} điểm)` }; } },
    { key: 'strong_vs_weak', name: 'Lịch sử học tốt ⇒ nhớ cao hơn lịch sử học kém', items: [{ review_history: strong, as_of: asOf(62) }, { review_history: weak, as_of: asOf(7) }],
      check: (p) => ({ pass: p[0].recall_probability > p[1].recall_probability, detail: `tốt ${Math.round(p[0].recall_probability * 100)}% — kém ${Math.round(p[1].recall_probability * 100)}%` }) },
    { key: 'fresh', name: 'Vừa ôn xong thành công ⇒ xác suất nhớ cao (≥ 70%)', items: [{ review_history: strong, as_of: asOf(60.01) }],
      check: (p) => ({ pass: p[0].recall_probability >= 0.7, detail: `${Math.round(p[0].recall_probability * 100)}%` }) },
    { key: 'forgotten', name: 'Học kém + bỏ lâu ⇒ xác suất nhớ thấp (≤ 60%)', items: [{ review_history: weak, as_of: asOf(200) }],
      check: (p) => ({ pass: p[0].recall_probability <= 0.6, detail: `${Math.round(p[0].recall_probability * 100)}%` }) },
    { key: 'range', name: 'Mọi xác suất nằm trong [0, 1] và có lịch ôn hợp lệ', items: Array.from({ length: 40 }, (_, i) => ({ review_history: [ev(0, ['again', 'hard', 'good', 'easy'][i % 4]), ev(1 + (i % 5), ['good', 'again', 'easy'][i % 3]), ev(3 + (i % 7), ['hard', 'good'][i % 2])], as_of: asOf(10 + i * 3) })),
      check: (p) => { const bad = p.filter((x) => !(x.recall_probability >= 0 && x.recall_probability <= 1) || Number.isNaN(Date.parse(x.next_review_at))); return { pass: bad.length === 0, detail: `${p.length - bad.length}/${p.length} dự đoán hợp lệ` }; } },
    { key: 'schedule_after', name: 'Lịch ôn tiếp theo không nằm trong quá khứ', items: [{ review_history: strong, as_of: asOf(61) }, { review_history: weak, as_of: asOf(8) }],
      check: (p) => { const ok = p.every((x, i) => Date.parse(x.next_review_at) >= Date.parse(i === 0 ? asOf(61) : asOf(8)) - 1000); return { pass: ok, detail: p.map((x) => x.next_review_at.slice(0, 16)).join(' | ') }; } },
    { key: 'schedule_gap', name: 'Học tốt ⇒ lịch ôn xa hơn học kém', items: [{ review_history: strong, as_of: asOf(60.5) }, { review_history: weak, as_of: asOf(5.5) }],
      check: (p) => { const a = Date.parse(p[0].next_review_at) - (BASE + 60.5 * DAY); const b = Date.parse(p[1].next_review_at) - (BASE + 5.5 * DAY); return { pass: a >= b, detail: `${(a / DAY).toFixed(1)} ngày so với ${(b / DAY).toFixed(1)} ngày` }; } },
    { key: 'cold_start', name: 'Ít hơn 3 lượt ôn ⇒ dùng SM-2 dự phòng', items: [{ review_history: [ev(0)], as_of: asOf(1) }],
      check: (p) => ({ pass: p[0].used_fallback_sm2 === true, detail: p[0].used_fallback_sm2 ? 'dùng SM-2 (đúng thiết kế)' : 'vẫn dùng ML' }) }
  ];

  const results = [];
  let version = null;
  for (const d of defs) {
    try {
      const { predictions, version: v } = await batch(d.items);
      version = v;
      const r = d.check(predictions);
      results.push({ key: d.key, name: d.name, pass: r.pass, detail: r.detail });
    } catch (err) {
      results.push({ key: d.key, name: d.name, pass: false, detail: `Lỗi: ${err.message}` });
    }
  }
  return { results, version };
}

async function realBacktest(limit) {
  const logs = await ReviewLog.findAll({ attributes: ['user_id', 'word_id', 'result', 'response_time_ms', 'reviewed_at'], order: [['user_id', 'ASC'], ['word_id', 'ASC'], ['reviewed_at', 'ASC']], limit: 30000, raw: true });
  const groups = new Map();
  logs.forEach((l) => {
    const k = `${l.user_id}:${l.word_id}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(l);
  });
  const samples = [];
  groups.forEach((list) => {
    for (let i = 3; i < list.length; i++) {
      const prior = list.slice(0, i);
      samples.push({
        at: new Date(list[i].reviewed_at).getTime(),
        y: RECALLED.has(list[i].result) ? 1 : 0,
        naive: prior.filter((x) => RECALLED.has(x.result)).length / prior.length,
        item: { review_history: prior.map((x) => ({ result: x.result, response_time_ms: x.response_time_ms, reviewed_at: new Date(x.reviewed_at).toISOString() })), as_of: new Date(list[i].reviewed_at).toISOString() }
      });
    }
  });
  samples.sort((a, b) => b.at - a.at);
  const picked = samples.slice(0, limit);
  if (picked.length < 30) return { n: picked.length, insufficient: true, available_logs: logs.length };
  const { predictions } = await batch(picked.map((s) => s.item));
  const pairs = picked.map((s, i) => ({ p: predictions[i].recall_probability, y: s.y, naive: s.naive }));
  const m = metrics(pairs);
  return { ...m, verdict: judge(m) };
}

async function simulation(count) {
  const rand = rng(20260701);
  const seqs = [];
  const items = [];
  const truth = [];
  for (let s = 0; s < count; s++) {
    let half = 1 + rand() * 5;
    let t = 0;
    const hist = [];
    const steps = 4 + Math.floor(rand() * 5);
    for (let k = 0; k < steps; k++) {
      const gap = half * (0.1 + rand() * 1.1);
      t += gap;
      const pTrue = Math.pow(2, -gap / half);
      const ok = rand() < pTrue;
      if (hist.length >= 3) {
        items.push({ review_history: hist.map((h) => ({ ...h })), as_of: asOf(t) });
        truth.push({ y: ok ? 1 : 0, naive: hist.filter((h) => RECALLED.has(h.result)).length / hist.length, pTrue });
      }
      hist.push(ev(t, ok ? (rand() < 0.3 ? 'easy' : 'good') : 'again'));
      half = ok ? half * (1.7 + rand() * 0.8) : Math.max(0.3, half * 0.5);
    }
    seqs.push(hist.length);
  }
  const { predictions } = await batch(items);
  const pairs = truth.map((x, i) => ({ p: predictions[i].recall_probability, y: x.y, naive: x.naive }));
  const m = metrics(pairs);
  const oracle = auc(truth.map((x) => ({ p: x.pTrue, y: x.y })));
  return { ...m, oracle_auc: oracle === null ? null : Number(oracle.toFixed(3)), verdict: { status: 'info', message: 'Dữ liệu mô phỏng nên chỉ mang tính tham khảo, không dùng để kết luận chất lượng model' } };
}

async function runMlTests({ samples = 400 } = {}) {
  if (!ML_URL()) throw new Error('Backend chưa cấu hình ML_SERVICE_URL');
  const health = await mlJson('/health', { timeout: 6000 });
  const golden = await goldenTests();
  const real = await realBacktest(Math.min(Math.max(Number(samples) || 400, 50), 1000));
  const simulated = await simulation(250);

  const failed = golden.results.filter((t) => !t.pass).length;
  let status = 'ok';
  let message = `Đạt ${golden.results.length - failed}/${golden.results.length} bài test hành vi.`;
  if (failed) status = failed > 2 ? 'fail' : 'warn';
  if (!real.insufficient) {
    if (real.verdict.status === 'fail') status = 'fail';
    else if (real.verdict.status === 'warn' && status === 'ok') status = 'warn';
  }
  if (health.model_loaded === false) {
    status = status === 'fail' ? 'fail' : 'warn';
    message += ' Model chưa được nạp nên ML đang dùng SM-2 dự phòng.';
  }
  message += real.insufficient
    ? ` Dữ liệu thật mới có ${real.n} mẫu hợp lệ (cần ≥ 30 lượt ôn có đủ lịch sử) nên chưa thể kết luận độ chính xác thực tế.`
    : ` Trên ${real.n} lượt ôn thật: ${real.verdict.message}.`;

  return {
    status,
    generated_at: new Date(),
    model: { loaded: health.model_loaded !== false, version: golden.version || health.model_version || null },
    summary: message,
    golden: golden.results,
    real,
    simulated
  };
}

module.exports = { runMlTests, metrics, auc, judge };
