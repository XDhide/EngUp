/**
 * SEED DỮ LIỆU "THẬT" — thật nhiều dữ liệu cho MỌI bảng (34 bảng).
 * ------------------------------------------------------------------------------------------
 * Được gọi tự động bởi:   npm run app:reset:real      (ở thư mục gốc EngUp)
 * Chạy riêng (DB đã reset, chỉ còn 2 admin):  cd Backend && node src/common/seed/seedReal.js [tuỳ chọn]
 *
 * Tuỳ chọn:
 *   --students=N     số học viên (mặc định 2000 ≈ 2,3 triệu dòng, ~1 phút; 5000 ≈ 6 triệu dòng, vài phút)
 *   --days=N         số ngày lịch sử hoạt động (mặc định 180)
 *   --density=X      nhân hệ số cường độ học (mặc định 1; 0.3 = nhẹ, 2 = dày gấp đôi)
 *   --rng=N          seed ngẫu nhiên (cùng seed -> cùng dữ liệu), mặc định 20260101
 *
 * Đặc điểm: insert hàng loạt bằng SQL thuần (nhanh hơn Sequelize hàng chục lần), có khoá ngoại đầy đủ,
 * dữ liệu nhất quán: thẻ SRS khớp lịch sử ôn tập, streak khớp ngày có học, đáp án khớp nội dung bài,
 * điểm khớp bài làm, hàng đợi duyệt khớp cờ is_approved, audit log khớp hàng đợi...
 * Tất cả học viên dùng chung mật khẩu:  Student@123   (student1@engup.test ... studentN@engup.test)
 */
const path = require('path');
const crypto = require('crypto');

try { require('dotenv').config({ path: path.join(__dirname, '../../../.env'), quiet: true }); } catch { /* bỏ qua */ }
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const { TOPICS, WORDS } = require('./realData/vocabulary');
const C = require('./realData/content');
const { PLACEMENT_TEST_QUESTIONS, LEVEL_THRESHOLDS } = require('../../modules/auth/placementTest.data');

// ───────────────────────── Tham số ─────────────────────────
const argv = process.argv.slice(2);
const opt = (name, def) => {
  const f = argv.find((a) => a.startsWith(`--${name}=`));
  if (!f) return def;
  const v = Number(f.split('=')[1]);
  return Number.isFinite(v) && v > 0 ? v : def;
};
const N_STUDENTS = Math.floor(opt('students', 2000));
const DAYS = Math.floor(opt('days', 180));
const DENSITY = opt('density', 1);
const RNG_SEED = Math.floor(opt('rng', 20260101));
const STUDENT_PASSWORD = 'Student@123';

const DAY_MS = 86400000;
const HOUR_MS = 3600000;
const LOCAL_OFFSET = 7 * HOUR_MS; // Asia/Ho_Chi_Minh (khớp APP_TIMEZONE của Backend)
const NOW = Date.now();
const localMidnight = (ms) => Math.floor((ms + LOCAL_OFFSET) / DAY_MS) * DAY_MS - LOCAL_OFFSET;
const START_MS = localMidnight(NOW) - DAYS * DAY_MS;
const dayStart = (i) => START_MS + i * DAY_MS;
const TODAY = DAYS;
const fmt = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
const dateStr = (i) => new Date(dayStart(i) + LOCAL_OFFSET).toISOString().slice(0, 10);

// ───────────────────────── Random có seed ─────────────────────────
function makeRng(seed) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    f,
    int: (lo, hi) => lo + Math.floor(f() * (hi - lo + 1)),
    float: (lo, hi) => lo + f() * (hi - lo),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
    shuffle: (arr) => {
      const x = arr.slice();
      for (let i = x.length - 1; i > 0; i -= 1) { const j = Math.floor(f() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
      return x;
    },
    sample: (arr, n) => r.shuffle(arr).slice(0, Math.max(0, n)),
    weighted: (entries) => {
      const total = entries.reduce((s, e) => s + e[1], 0);
      let x = f() * total;
      for (const [v, w] of entries) { x -= w; if (x <= 0) return v; }
      return entries[entries.length - 1][0];
    }
  };
  return r;
}
const r = makeRng(RNG_SEED);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const lvIdx = (lv) => Math.max(0, C.LEVELS.indexOf(lv));
const hex = (n) => crypto.randomBytes(n).toString('hex');

// ───────────────────────── Bulk insert ─────────────────────────
const TABLE_ORDER = [
  'users', 'refresh_tokens', 'placement_test_results',
  'vocabulary_topics', 'vocabulary_words', 'user_vocabulary_cards', 'review_logs', 'personal_notebook_entries',
  'reading_articles', 'reading_questions', 'reading_attempts',
  'listening_lessons', 'listening_dictation_attempts', 'ml_prediction_logs',
  'writing_prompts', 'writing_submissions',
  'test_sets', 'test_questions', 'user_test_attempts',
  'streaks', 'notification_settings', 'notifications', 'notification_templates',
  'audit_logs', 'admin_content_approval_queue', 'error_logs',
  'subscription_plans', 'subscriptions', 'user_notes', 'placement_questions', 'system_job_runs',
  'learning_paths', 'learning_path_items', 'learning_path_enrollments'
];
const COLS = {
  users: ['id', 'email', 'password_hash', 'full_name', 'role', 'level_current', 'learning_goal', 'daily_target_minutes', 'daily_new_word_limit', 'is_active', 'created_at', 'updated_at'],
  refresh_tokens: ['id', 'user_id', 'token_hash', 'expires_at', 'revoked_at', 'created_at'],
  placement_test_results: ['id', 'user_id', 'answers', 'suggested_level', 'created_at'],
  vocabulary_topics: ['id', 'name', 'description', 'image_url', 'created_at'],
  vocabulary_words: ['id', 'topic_id', 'word', 'phonetic', 'meaning', 'example_sentence', 'audio_url', 'difficulty', 'is_approved', 'created_by', 'created_at', 'updated_at'],
  user_vocabulary_cards: ['id', 'user_id', 'word_id', 'ease_factor', 'interval_days', 'repetitions', 'half_life_hours', 'recall_probability', 'next_review_at', 'created_at', 'updated_at'],
  review_logs: ['id', 'card_id', 'user_id', 'word_id', 'result', 'response_time_ms', 'reviewed_at'],
  personal_notebook_entries: ['id', 'user_id', 'word_id', 'source_type', 'source_id', 'note', 'tags', 'created_at', 'updated_at'],
  reading_articles: ['id', 'title', 'content', 'difficulty', 'topic', 'is_ai_generated', 'is_approved', 'created_by', 'created_at'],
  reading_questions: ['id', 'article_id', 'question_text', 'options', 'correct_answer', 'explanation'],
  reading_attempts: ['id', 'user_id', 'article_id', 'answers', 'score', 'correct_count', 'total_count', 'submitted_at'],
  listening_lessons: ['id', 'title', 'audio_url', 'transcript', 'difficulty', 'topic', 'created_at'],
  listening_dictation_attempts: ['id', 'user_id', 'lesson_id', 'user_text', 'accuracy_percent', 'wrong_words', 'submitted_at'],
  ml_prediction_logs: ['id', 'user_id', 'word_id', 'recall_probability', 'predicted_next_review_at', 'used_fallback_sm2', 'model_version', 'actual_result', 'predicted_at'],
  writing_prompts: ['id', 'title', 'prompt_text', 'type', 'difficulty', 'created_at'],
  writing_submissions: ['id', 'user_id', 'prompt_id', 'content', 'ai_feedback', 'ai_score', 'created_at'],
  test_sets: ['id', 'exam_type', 'section', 'title', 'time_limit_minutes', 'created_at'],
  test_questions: ['id', 'test_set_id', 'question_text', 'question_type', 'options', 'correct_answer', 'audio_url', 'passage_text', 'order_index', 'is_approved'],
  user_test_attempts: ['id', 'user_id', 'test_set_id', 'answers', 'started_at', 'submitted_at', 'score', 'band_score', 'status'],
  streaks: ['id', 'user_id', 'current_streak', 'longest_streak', 'last_active_date', 'frozen_until'],
  notification_settings: ['id', 'user_id', 'daily_reminder_time', 'review_reminder_enabled', 'push_token'],
  notifications: ['id', 'user_id', 'title', 'body', 'type', 'is_read', 'created_at'],
  notification_templates: ['id', 'name', 'title_template', 'body_template', 'type', 'created_at'],
  audit_logs: ['id', 'actor_id', 'action', 'target_type', 'target_id', 'detail', 'created_at'],
  admin_content_approval_queue: ['id', 'content_type', 'content_id', 'submitted_by', 'title', 'status', 'reject_reason', 'reviewed_by', 'reviewed_at', 'created_at'],
  error_logs: ['id', 'service', 'level', 'message', 'stack_trace', 'created_at'],
  subscription_plans: ['id', 'name', 'price', 'duration_days', 'features', 'created_at'],
  subscriptions: ['id', 'user_id', 'plan_id', 'status', 'start_date', 'end_date', 'created_at'],
  user_notes: ['id', 'user_id', 'title', 'content', 'color', 'is_pinned', 'ref_type', 'ref_id', 'ref_label', 'created_at', 'updated_at'],
  placement_questions: ['id', 'level', 'question_text', 'options', 'correct_option_id', 'order_index', 'is_active', 'created_at', 'updated_at'],
  system_job_runs: ['id', 'job_name', 'trigger', 'status', 'target_date', 'summary', 'error_message', 'duration_ms', 'created_at'],
  learning_paths: ['id', 'title', 'description', 'level', 'created_by', 'is_approved', 'created_at', 'updated_at'],
  learning_path_items: ['id', 'path_id', 'item_type', 'item_id', 'order_index'],
  learning_path_enrollments: ['id', 'user_id', 'path_id', 'completed_at', 'created_at']
};
const BUF = {};
const COUNT = {};
const NEXT_ID = {};
TABLE_ORDER.forEach((t) => { BUF[t] = { rows: [], bytes: 0 }; COUNT[t] = 0; NEXT_ID[t] = 1; });
const nid = (t) => NEXT_ID[t]++;
let pendingRows = 0;

const JSONS = (v) => JSON.stringify(v);
function add(table, row) {
  const b = BUF[table];
  b.rows.push(row);
  let n = 0;
  for (const v of row) n += typeof v === 'string' ? v.length + 3 : 12;
  b.bytes += n;
  pendingRows += 1;
  COUNT[table] += 1;
}

let conn;
async function flushTable(table) {
  const b = BUF[table];
  if (!b.rows.length) return;
  const cols = COLS[table].map((c) => `\`${c}\``).join(',');
  const sql = `INSERT INTO \`${table}\` (${cols}) VALUES ?`;
  let i = 0;
  while (i < b.rows.length) {
    let bytes = 0;
    const chunk = [];
    while (i < b.rows.length && chunk.length < 2000 && bytes < 1000000) {
      const row = b.rows[i];
      chunk.push(row);
      for (const v of row) bytes += typeof v === 'string' ? v.length + 3 : 12;
      i += 1;
    }
    await conn.query(sql, [chunk]);
  }
  b.rows = [];
  b.bytes = 0;
}
async function flushAll() {
  for (const t of TABLE_ORDER) await flushTable(t);
  pendingRows = 0;
}

// ───────────────────────── Dữ liệu tên người Việt ─────────────────────────
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trương', 'Lâm', 'Mai'];
const DEM_NAM = ['Văn', 'Hữu', 'Minh', 'Quang', 'Đức', 'Thành', 'Anh', 'Gia', 'Tuấn', 'Công'];
const DEM_NU = ['Thị', 'Ngọc', 'Thùy', 'Mai', 'Phương', 'Thanh', 'Bảo', 'Khánh', 'Kim', 'Diệu'];
const TEN_NAM = ['An', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Hải', 'Hiếu', 'Hùng', 'Huy', 'Khoa', 'Kiên', 'Long', 'Nam', 'Nghĩa', 'Phong', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Thắng', 'Tiến', 'Trung', 'Việt', 'Vinh', 'Khánh'];
const TEN_NU = ['Anh', 'Chi', 'Dung', 'Giang', 'Hà', 'Hạnh', 'Hoa', 'Hương', 'Lan', 'Linh', 'Loan', 'My', 'Ngân', 'Nhung', 'Oanh', 'Phương', 'Quyên', 'Thảo', 'Trang', 'Trinh', 'Uyên', 'Vy', 'Yến', 'Mai', 'Thu'];
const GOALS = ['Giao tiếp công việc', 'Luyện thi IELTS', 'Luyện thi TOEIC', 'Du học', 'Đi du lịch tự túc', 'Thăng tiến trong công việc', 'Học để xem phim không cần phụ đề', 'Cải thiện phát âm', 'Mở rộng vốn từ vựng', 'Thi chứng chỉ tốt nghiệp', 'Giao tiếp với bạn bè quốc tế', 'Xin học bổng', 'Đọc tài liệu chuyên ngành', 'Làm việc cho công ty nước ngoài'];
const NOTE_REF_TYPES = ['none', 'word', 'reading', 'listening', 'test'];
const AUDIO = ['/uploads/audio/ordering-coffee.mp3', '/uploads/audio/job-interview.mp3'];

function randomName() {
  const nu = r.chance(0.5);
  return `${r.pick(HO)} ${r.pick(nu ? DEM_NU : DEM_NAM)} ${r.pick(nu ? TEN_NU : TEN_NAM)}`;
}

// ───────────────────────── Chấm nghe chép (giống Backend) ─────────────────────────
const normWord = (w) => w.toLowerCase().replace(/[.,!?;:"'“”‘’()-]/g, '').trim();
const tokenize = (t) => (t || '').trim().split(/\s+/).filter(Boolean);
function compareDictation(transcript, userText) {
  const tw = tokenize(transcript), uw = tokenize(userText), wrong = [];
  tw.forEach((w, i) => { if (uw[i] === undefined || normWord(uw[i]) !== normWord(w)) wrong.push(w); });
  return { accuracy: Number((((tw.length - wrong.length) / tw.length) * 100).toFixed(2)), wrong };
}
function noisyDictation(transcript, skill) {
  const words = tokenize(transcript);
  const errRate = clamp(0.45 - skill * 0.09 + r.float(-0.08, 0.08), 0.0, 0.7);
  let out = words.map((w) => {
    if (!r.chance(errRate)) return w;
    const k = r.int(0, 2);
    if (k === 0 && w.length > 3) { const p = r.int(1, w.length - 2); return w.slice(0, p) + w.slice(p + 1); }
    if (k === 1) return r.pick(['the', 'a', 'is', 'to', 'and', 'it']);
    return w.slice(0, Math.max(1, w.length - 1)) + r.pick(['s', 'e', 'd', 'n']);
  });
  if (r.chance(0.2)) out = out.slice(0, Math.max(3, Math.floor(out.length * r.float(0.5, 0.9))));
  return out.join(' ');
}

// ───────────────────────── Biến toàn cục nội dung ─────────────────────────
let adminIds = [];
const ART = [];            // {id, diffIdx, approved, topic, qs:[{id, correct}]}
const LESSONS = [];        // {id, transcript, diffIdx}
const PROMPTS = [];        // {id, type, diffIdx}
const SETS = [];           // {id, exam, section, limit, qs:[{id,type,correct}]}
let approvedWordIds = [];
const WORD_BY_ID = new Map();
let contentCreatedFrom, contentCreatedTo;
const timeBetween = (a, b) => Math.floor(a + r.f() * (b - a));
const contentTime = () => timeBetween(contentCreatedFrom, contentCreatedTo);

function log(m) { console.log(`   ${m}`); }

// ───────────────────────── Sinh nội dung dùng chung ─────────────────────────
async function seedContent() {
  contentCreatedFrom = START_MS - 45 * DAY_MS;
  contentCreatedTo = NOW - 3 * DAY_MS;
  const adm = () => r.pick(adminIds);

  // --- Từ vựng
  TOPICS.forEach((t, i) => add('vocabulary_topics', [i + 1, t.name, t.description, null, fmt(contentTime())]));
  const topicWordIds = TOPICS.map(() => []);
  WORDS.forEach((w, i) => {
    const id = i + 1;
    const approved = !r.chance(0.04);
    const created = contentTime();
    add('vocabulary_words', [id, w.topicIndex + 1, w.word, w.phonetic, w.meaning, w.example_sentence, null, w.difficulty, approved ? 1 : 0, r.chance(0.5) ? adm() : null, fmt(created), fmt(created + r.int(0, 20) * DAY_MS)]);
    WORD_BY_ID.set(id, { id, diffIdx: lvIdx(w.difficulty), topicIndex: w.topicIndex, approved });
    topicWordIds[w.topicIndex].push(id);
    if (approved) approvedWordIds.push(id);
  });
  WORD_BY_ID.topicWordIds = topicWordIds;
  log(`Từ vựng: ${TOPICS.length} chủ đề, ${WORDS.length} từ`);

  // --- Bài đọc + câu hỏi
  const usedTitles = new Set();
  const nArticles = 400;
  for (let i = 0; i < nArticles; i += 1) {
    const a = C.makeReading(r, usedTitles);
    const id = nid('reading_articles');
    const diff = r.weighted([['A1', 8], ['A2', 17], ['B1', 28], ['B2', 25], ['C1', 15], ['C2', 7]]);
    const ai = r.chance(0.35);
    const approved = ai ? !r.chance(0.25) : true;
    add('reading_articles', [id, a.title, a.content, diff, a.topic, ai ? 1 : 0, approved ? 1 : 0, ai ? null : adm(), fmt(contentTime())]);
    const qs = a.questions.map((q) => {
      const qid = nid('reading_questions');
      add('reading_questions', [qid, id, q.question_text, JSONS(q.options), q.correct_answer, q.explanation]);
      return { id: qid, correct: q.correct_answer };
    });
    ART.push({ id, diffIdx: lvIdx(diff), approved, ai, topic: a.topic, title: a.title, qs, created_by_admin: !ai });
  }
  log(`Bài đọc: ${ART.length} bài, ${COUNT.reading_questions} câu hỏi`);

  // --- Bài nghe
  const usedL = new Set();
  for (let i = 0; i < 300; i += 1) {
    const l = C.makeListening(r, usedL);
    const id = nid('listening_lessons');
    const diff = r.weighted([['A1', 12], ['A2', 25], ['B1', 30], ['B2', 20], ['C1', 10], ['C2', 3]]);
    add('listening_lessons', [id, l.title, AUDIO[i % AUDIO.length], l.transcript, diff, l.topic, fmt(contentTime())]);
    LESSONS.push({ id, transcript: l.transcript, diffIdx: lvIdx(diff), topic: l.topic, question: l.question });
  }
  log(`Bài nghe: ${LESSONS.length} bài`);

  // --- Đề viết
  C.makeWritingPrompts(r).forEach((p) => {
    const id = nid('writing_prompts');
    add('writing_prompts', [id, p.title, p.prompt_text, p.type, p.difficulty, fmt(contentTime())]);
    PROMPTS.push({ id, type: p.type, diffIdx: lvIdx(p.difficulty), text: p.prompt_text });
  });
  log(`Đề viết: ${PROMPTS.length} đề`);

  // --- Đề thi + câu hỏi
  const defs = [
    ['IELTS', 'reading', 24, 20, 'IELTS Reading Practice Test'], ['IELTS', 'writing', 14, 40, 'IELTS Writing Task 2 Practice'],
    ['IELTS', 'listening', 12, 15, 'IELTS Listening Practice Test'], ['TOEIC', 'grammar', 26, 12, 'TOEIC Part 5 Grammar Practice'],
    ['TOEIC', 'reading', 12, 20, 'TOEIC Reading Practice Test'], ['TOEIC', 'listening', 12, 15, 'TOEIC Listening Practice Test'],
    ['TOEIC', 'writing', 6, 30, 'TOEIC Writing Email Practice']
  ];
  const writingPrompts = PROMPTS.filter((p) => p.type === 'ielts');
  const emailPrompts = PROMPTS.filter((p) => p.type === 'toeic');
  for (const [exam, section, count, limit, base] of defs) {
    for (let k = 1; k <= count; k += 1) {
      const sid = nid('test_sets');
      add('test_sets', [sid, exam, section, `${base} ${k}`, limit, fmt(contentTime())]);
      const set = { id: sid, exam, section, limit, qs: [] };
      let order = 0;
      const addQ = (q, extra = {}) => {
        order += 1;
        const qid = nid('test_questions');
        const approved = !r.chance(0.02);
        add('test_questions', [qid, sid, q.question_text, q.question_type, q.options ? JSONS(q.options) : null, q.correct_answer ?? null, extra.audio_url || null, extra.passage_text || null, order, approved ? 1 : 0]);
        set.qs.push({ id: qid, type: q.question_type, correct: q.correct_answer ?? null, approved });
      };
      if (section === 'reading') {
        for (let p = 0; p < 2; p += 1) {
          const a = C.makeReading(r, new Set(), { frameCount: 5 });
          a.questions.forEach((q) => addQ({ ...q, question_type: 'multiple_choice' }, { passage_text: a.content }));
        }
      } else if (section === 'grammar') {
        const seen = new Set();
        while (set.qs.length < 25) { const g = C.makeGrammar(r); if (seen.has(g.question_text)) continue; seen.add(g.question_text); addQ(g); }
      } else if (section === 'listening') {
        const used = new Set();
        let guard = 0;
        while (set.qs.length < 8 && guard < 50) {
          guard += 1;
          const l = C.makeListening(r, new Set());
          if (used.has(l.question.question_text + l.transcript)) continue;
          used.add(l.question.question_text + l.transcript);
          addQ({ ...l.question, question_type: 'multiple_choice' }, { audio_url: AUDIO[set.qs.length % AUDIO.length] });
        }
      } else {
        const pool = section === 'writing' && exam === 'IELTS' ? writingPrompts : emailPrompts;
        const n = exam === 'IELTS' ? 1 : 2;
        r.sample(pool, n).forEach((p) => addQ({ question_text: p.text, question_type: 'essay' }));
      }
      SETS.push(set);
    }
  }
  log(`Đề thi: ${SETS.length} đề, ${COUNT.test_questions} câu hỏi`);

  // --- Placement
  PLACEMENT_TEST_QUESTIONS.forEach((q, i) => {
    add('placement_questions', [i + 1, q.level, q.question_text, JSONS(q.options.map(({ id, text }) => ({ id, text }))), q.correct_option_id, i + 1, 1, fmt(START_MS - 60 * DAY_MS), fmt(START_MS - 60 * DAY_MS)]);
  });
  NEXT_ID.placement_questions = PLACEMENT_TEST_QUESTIONS.length + 1;
  C.makePlacementBank(r, 108).forEach((q, i) => {
    add('placement_questions', [nid('placement_questions'), q.level, q.question_text, JSONS(q.options), q.correct_option_id, PLACEMENT_TEST_QUESTIONS.length + 1 + i, 0, fmt(contentTime()), fmt(contentTime())]);
  });
  log(`Placement: ${COUNT.placement_questions} câu (12 câu đang bật + ngân hàng câu hỏi dự phòng chưa bật)`);

  // --- Mẫu thông báo + gói đăng ký
  C.NOTIFICATION_TEMPLATES.forEach((t) => add('notification_templates', [nid('notification_templates'), t.name, t.title_template, t.body_template, t.type, fmt(contentTime())]));
  C.PLANS.forEach((p) => add('subscription_plans', [nid('subscription_plans'), p.name, p.price, p.duration_days, JSONS(p.features), fmt(START_MS - 90 * DAY_MS)]));
  log(`Mẫu thông báo: ${COUNT.notification_templates}, gói đăng ký: ${COUNT.subscription_plans}`);

  // --- Lộ trình học
  const LV_PATH = [['A1', 'cho người mới bắt đầu'], ['B1', 'trình độ trung cấp'], ['B2', 'nâng cao']];
  const pathIds = [];
  TOPICS.forEach((t, ti) => {
    LV_PATH.forEach(([lv, label], li) => {
      const id = nid('learning_paths');
      const approved = r.chance(0.82);
      const created = contentTime();
      add('learning_paths', [id, `${t.name}: lộ trình ${label}`, `Lộ trình ${t.description.toLowerCase()} dành cho ${label}. Gồm từ vựng, bài đọc và bài nghe chọn lọc.`, lv, r.chance(0.7) ? adm() : null, approved ? 1 : 0, fmt(created), fmt(created + r.int(0, 10) * DAY_MS)]);
      pathIds.push({ id, approved, title: `${t.name}: lộ trình ${label}`, created });
      const used = new Set();
      let order = 0;
      const item = (type, itemId) => {
        const key = `${type}:${itemId}`;
        if (used.has(key)) return;
        used.add(key);
        order += 1;
        add('learning_path_items', [nid('learning_path_items'), id, type, itemId, order]);
      };
      r.sample(topicWordIds[ti].filter((w) => WORD_BY_ID.get(w).approved), r.int(8, 16)).forEach((w) => item('word', w));
      const firstWord = t.name.split(' ')[0];
      const matching = ART.filter((a) => a.approved && a.topic.startsWith(firstWord));
      r.sample(matching.length >= 2 ? matching : ART.filter((a) => a.approved), r.int(2, 5)).forEach((a) => item('reading', a.id));
      r.sample(LESSONS, r.int(2, 5)).forEach((l) => item('listening', l.id));
    });
  });
  WORD_BY_ID.pathIds = pathIds;
  log(`Lộ trình: ${pathIds.length} lộ trình, ${COUNT.learning_path_items} mục`);
  await flushAll();
}

// ───────────────────────── Mô phỏng học viên ─────────────────────────
const PROFILES = {
  power:   { pDay: 0.85, rev: [25, 60], act: 1.0 },
  regular: { pDay: 0.55, rev: [10, 30], act: 0.6 },
  casual:  { pDay: 0.25, rev: [5, 15],  act: 0.35 },
  dormant: { pDay: 0.5,  rev: [3, 8],   act: 0.2 }
};
const RESULT_Q = { again: 1, hard: 3, good: 4, easy: 5 };

function sm2(card, result) {
  let ef = card.ef, interval = card.interval, reps = card.reps;
  const q = RESULT_Q[result];
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (result === 'again') { reps = 0; interval = 1; } else {
    reps += 1;
    if (reps === 1) interval = result === 'easy' ? 3 : 1;
    else if (reps === 2) interval = result === 'easy' ? 7 : result === 'hard' ? 3 : 5;
    else interval = Math.max(interval + 1, Math.round(interval * (result === 'hard' ? 1.15 : result === 'easy' ? ef * 0.95 : ef * 0.65)));
  }
  return { ef: Number(ef.toFixed(2)), interval: Math.min(interval, 180), reps };
}

function pickResult(card, word, userIdx, nowMs) {
  const overdueDays = (nowMs - card.next) / DAY_MS;
  const levelGap = Math.max(0, word.diffIdx - userIdx);
  let pAgain = 0.07 + 0.05 * levelGap + (overdueDays > card.interval ? 0.08 : 0) - Math.min(0.04, card.reps * 0.006);
  pAgain = clamp(pAgain, 0.03, 0.4);
  const pHard = 0.14, pEasy = clamp(0.14 - 0.03 * levelGap + card.reps * 0.004, 0.03, 0.25);
  const x = r.f();
  if (x < pAgain) return 'again';
  if (x < pAgain + pHard) return 'hard';
  if (x > 1 - pEasy) return 'easy';
  return 'good';
}
const RESP_MS = { again: [5000, 12000], hard: [3500, 8000], good: [1500, 4500], easy: [800, 2000] };

async function seedStudents(passwordHash) {
  const [[{ maxId }]] = await conn.query('SELECT COALESCE(MAX(id),0) AS maxId FROM users');
  NEXT_ID.users = Number(maxId) + 1;
  const studentIds = [];
  const t0 = Date.now();
  const pathIds = WORD_BY_ID.pathIds.filter((p) => p.approved);
  const subs = []; // dùng sau
  const studentRecords = [];

  for (let si = 1; si <= N_STUDENTS; si += 1) {
    const uid = nid('users');
    studentIds.push(uid);
    const vip = si <= 2; // student1/student2: tài khoản demo hoạt động đều, dữ liệu dày
    const profileName = vip ? 'power' : r.weighted([['power', 10], ['regular', 35], ['casual', 35], ['dormant', 20]]);
    const P = PROFILES[profileName];
    const joinDay = vip ? 0 : Math.min(TODAY - 1, Math.floor(Math.pow(r.f(), 1.4) * TODAY));
    const joinMs = dayStart(joinDay) + r.int(7, 21) * HOUR_MS + r.int(0, 3599) * 1000;
    const createdMs = Math.min(joinMs, NOW - 60000);
    const habitHour = r.int(6, 22);
    const limit = r.pick([5, 10, 10, 10, 15, 20]);
    const target = r.pick([10, 15, 15, 20, 30, 45, 60]);
    const goal = r.pick(GOALS);
    const userLvTrue = r.weighted([['A1', 10], ['A2', 20], ['B1', 30], ['B2', 25], ['C1', 12], ['C2', 3]]);
    const uIdx = lvIdx(userLvTrue);
    const isActive = vip ? true : !r.chance(0.04);
    const timeOfDay = (d) => {
      const h = clamp(Math.round(habitHour + (r.f() + r.f() + r.f() - 1.5) * 3), 5, 23);
      let ms = dayStart(d) + h * HOUR_MS + r.int(0, 3599) * 1000;
      if (ms > NOW) ms = Math.max(dayStart(d), NOW - r.int(60000, HOUR_MS));
      return Math.max(ms, d === joinDay ? createdMs + 60000 : 0);
    };

    // --- Placement test lúc đăng ký (80% làm)
    let level = userLvTrue;
    const didPlacement = vip || r.chance(0.8);
    if (didPlacement) {
      const answers = [];
      let correct = 0;
      PLACEMENT_TEST_QUESTIONS.forEach((q, qi) => {
        const ok = r.chance(clamp(0.75 + 0.14 * (uIdx - lvIdx(q.level)), 0.1, 0.97));
        const opt = ok ? q.correct_option_id : r.pick(q.options.filter((o) => o.id !== q.correct_option_id)).id;
        if (ok) correct += 1;
        answers.push({ question_id: qi + 1, answer: opt });
      });
      const pct = (correct / PLACEMENT_TEST_QUESTIONS.length) * 100;
      level = (LEVEL_THRESHOLDS.find((t) => pct >= t.minPercent) || { level: 'A1' }).level;
      add('placement_test_results', [nid('placement_test_results'), uid, JSONS(answers), level, fmt(createdMs + r.int(60, 1200) * 1000)]);
    }
    const userIdx = lvIdx(level);

    // --- Ngày hoạt động
    const active = new Set();
    const churn = profileName === 'dormant' ? r.int(1, 10) : (!vip && r.chance(0.25) ? r.int(10, 90) : Infinity);
    for (let d = joinDay; d <= TODAY; d += 1) {
      if (d - joinDay > churn) break;
      let p = P.pDay;
      if (profileName === 'dormant') p = 0.6;
      if (r.chance(Math.min(1, p * DENSITY))) active.add(d);
    }
    if (vip) for (let d = Math.max(joinDay, TODAY - 45); d <= TODAY - 1; d += 1) active.add(d); // tài khoản demo: chưa học hôm nay -> còn thẻ cần ôn
    else if ((profileName === 'power' || profileName === 'regular') && r.chance(0.35)) {
      for (let d = Math.max(joinDay, TODAY - r.int(2, 30)); d <= TODAY; d += 1) active.add(d);
    }
    active.add(joinDay);
    const activeDays = [...active].filter((d) => d >= joinDay && d <= TODAY).sort((a, b) => a - b);
    const lastActiveDay = activeDays[activeDays.length - 1];

    // --- Mô phỏng thẻ SRS + ôn tập
    const cards = [];
    const owned = new Set();
    // giới hạn số từ đã học để học viên nào cũng còn từ mới (tài khoản demo còn >150 từ chưa học)
    const maxCards = vip ? 220 : ({ power: () => r.int(150, 300), regular: () => r.int(60, 220), casual: () => r.int(15, 100), dormant: () => r.int(5, 40) })[profileName]();
    const reviewCap = (day) => Math.max(1, Math.round(r.int(P.rev[0], P.rev[1]) * DENSITY));
    const doReview = (card, t, forcedFirst) => {
      const word = WORD_BY_ID.get(card.wordId);
      const result = forcedFirst || pickResult(card, word, userIdx, t);
      const [lo, hi] = RESP_MS[result];
      add('review_logs', [nid('review_logs'), card.id, uid, card.wordId, result, r.int(lo, hi), fmt(t)]);
      if (card.pendingMl) { card.pendingMl[7] = result; add('ml_prediction_logs', card.pendingMl); card.pendingMl = null; }
      const upd = sm2(card, result);
      card.ef = upd.ef; card.interval = upd.interval; card.reps = upd.reps;
      card.last = t;
      card.next = t + (result === 'again' ? DAY_MS : upd.interval * DAY_MS); // thẻ quên: hẹn lại sau 1 ngày
      card.halfLife = Number(Math.max(6, (result === 'again' ? 0.5 : upd.interval) * 24 * r.float(4, 8)).toFixed(2));
      card.prob = Number(clamp(Math.pow(2, -((card.next - t) / HOUR_MS) / card.halfLife), 0.05, 0.99).toFixed(4));
      card.touched = t;
      if (r.chance(0.55)) {
        const fallback = r.chance(0.15);
        card.pendingMl = [nid('ml_prediction_logs'), uid, card.wordId, card.prob, fmt(card.next), fallback ? 1 : 0, fallback ? 'sm2-fallback' : 'hlr-v1.2', null, fmt(t)];
      }
    };

    const notebookWords = new Set();
    const noteTexts = [];
    for (const d of activeDays) {
      const dayEnd = dayStart(d + 1);
      // (a) từ mới
      const room = Math.min(approvedWordIds.length - owned.size, maxCards - owned.size);
      const nNew = Math.min(room, profileName === 'power' || profileName === 'regular' ? r.int(Math.ceil(limit * 0.4), limit) : r.int(1, Math.max(2, Math.ceil(limit / 2))));
      for (let k = 0; k < nNew; k += 1) {
        let wid, guard = 0;
        do { wid = r.pick(approvedWordIds); guard += 1; } while (owned.has(wid) && guard < 30);
        if (owned.has(wid)) continue;
        owned.add(wid);
        const t = timeOfDay(d);
        const card = { id: nid('user_vocabulary_cards'), wordId: wid, ef: 2.5, interval: 0, reps: 0, next: t, last: 0, halfLife: null, prob: null, created: t, touched: t, pendingMl: null };
        cards.push(card);
        doReview(card, t, r.weighted([['good', 60], ['easy', 15], ['hard', 15], ['again', 10]]));
      }
      // (b) ôn thẻ đến hạn
      let due = cards.filter((c) => c.next < dayEnd && c.last < dayEnd - HOUR_MS * 2 && c.created < dayStart(d)).sort((a, b) => a.next - b.next);
      if (d === TODAY) due = r.shuffle(due.filter((c) => c.next <= NOW)); // hôm nay: chỉ thẻ đã đến hạn, ôn ngẫu nhiên một phần
      let cap = reviewCap(d);
      if (d >= TODAY - 3) cap = Math.floor(Math.min(cap, due.length) * r.float(0.3, 0.7)); // vài ngày gần đây ôn dở -> còn thẻ đến hạn để demo
      for (const card of due.slice(0, cap)) {
        const t = Math.max(timeOfDay(d), card.last + 60000);
        if (t > NOW || t >= dayEnd) continue;
        doReview(card, t);
      }
      // (c) hoạt động khác
      const act = P.act * DENSITY;
      if (r.chance(0.40 * act)) { // đọc hiểu
        const arts = ART.filter((a) => a.approved);
        const a = r.pick(arts);
        const pOk = clamp(0.55 + 0.12 * (userIdx - a.diffIdx) + r.float(-0.1, 0.1), 0.15, 0.98);
        const answers = [];
        let ok = 0;
        a.qs.forEach((q) => {
          const good = r.chance(pOk);
          if (good) ok += 1;
          answers.push({ question_id: q.id, answer: good ? q.correct : r.pick(C.LETTERS.filter((x) => x !== q.correct)) });
        });
        add('reading_attempts', [nid('reading_attempts'), uid, a.id, JSONS(answers), Number(((ok / a.qs.length) * 100).toFixed(2)), ok, a.qs.length, fmt(timeOfDay(d))]);
      }
      if (r.chance(0.35 * act)) { // nghe chép
        const l = r.pick(LESSONS);
        const text = noisyDictation(l.transcript, clamp(userIdx - l.diffIdx + 2, 0, 5));
        const res = compareDictation(l.transcript, text);
        add('listening_dictation_attempts', [nid('listening_dictation_attempts'), uid, l.id, text, res.accuracy, JSONS(res.wrong), fmt(timeOfDay(d))]);
      }
      if (r.chance(0.12 * act)) { // viết AI
        const p = r.pick(PROMPTS);
        const nSent = r.int(4, 11);
        const content = r.sample(C.ESSAY_SENTENCES, nSent).join(' ');
        const score = Number(clamp(38 + userIdx * 7 + r.float(-10, 12) + nSent, 20, 98).toFixed(2));
        add('writing_submissions', [nid('writing_submissions'), uid, p.id, content,
          JSONS({ overall_comment: r.pick(C.FEEDBACK.overall), grammar_errors: r.sample(C.FEEDBACK.grammar, r.int(1, 4)), vocabulary_suggestions: r.sample(C.FEEDBACK.vocab, r.int(1, 3)) }), score, fmt(timeOfDay(d))]);
      }
      if (r.chance(0.15 * act)) { // làm đề thi
        const set = r.pick(SETS);
        const start = timeOfDay(d);
        const id = nid('user_test_attempts');
        if (r.chance(0.06)) {
          add('user_test_attempts', [id, uid, set.id, null, fmt(start), null, null, null, 'in_progress']);
        } else if (set.section === 'writing') {
          const content = r.sample(C.ESSAY_SENTENCES, r.int(5, 12)).join(' ');
          const band = r.chance(0.1) ? null : (set.exam === 'IELTS' ? Math.round(clamp(3.5 + userIdx * 0.7 + r.float(-0.8, 0.8), 3, 9) * 2) / 2 : Math.round(clamp(80 + userIdx * 18 + r.float(-20, 20), 40, 200)));
          add('user_test_attempts', [id, uid, set.id, JSONS({ content }), fmt(start), fmt(start + r.int(10, set.limit) * 60000), null, band, 'submitted']);
        } else {
          const gradable = set.qs.filter((q) => q.type === 'multiple_choice' || q.type === 'fill_blank');
          const pOk = clamp(0.5 + 0.1 * (userIdx - 2) + r.float(-0.12, 0.12), 0.1, 0.97);
          let ok = 0;
          const answers = gradable.map((q) => {
            const good = r.chance(pOk);
            if (good) ok += 1;
            return { question_id: q.id, answer: good ? q.correct : (q.type === 'fill_blank' ? r.pick(['at', 'in', 'on', 'by']) : r.pick(C.LETTERS.filter((x) => x !== q.correct))) };
          });
          const score = Number(((ok / gradable.length) * 100).toFixed(2));
          const band = set.exam === 'IELTS' ? Math.round((score / 100) * 9 * 2) / 2 : Math.round((score / 100) * 990);
          add('user_test_attempts', [id, uid, set.id, JSONS(answers), fmt(start), fmt(start + r.int(Math.ceil(set.limit / 2), set.limit) * 60000), score, band, 'submitted']);
        }
      }
      if (r.chance(0.6 * act) && cards.length) { // sổ tay
        const c = r.pick(cards);
        if (!notebookWords.has(c.wordId)) {
          notebookWords.add(c.wordId);
          const src = r.weighted([['vocabulary', 40], ['reading', 25], ['listening', 15], ['manual', 20]]);
          const srcId = src === 'reading' ? r.pick(ART).id : src === 'listening' ? r.pick(LESSONS).id : null;
          const t = timeOfDay(d);
          add('personal_notebook_entries', [nid('personal_notebook_entries'), uid, c.wordId, src, srcId,
            r.chance(0.6) ? r.pick(['Hay gặp trong bài đọc', 'Cần học thêm ví dụ', 'Từ khó nhớ', 'Dùng trong IELTS Writing', 'Nhớ cách phát âm', 'Có trong đề TOEIC']) : null,
            r.chance(0.5) ? JSONS(r.sample(['quan trọng', 'ôn lại', 'IELTS', 'TOEIC', 'giao tiếp', 'khó'], r.int(1, 3))) : null, fmt(t), fmt(t)]);
        }
      }
      if (r.chance(0.16 * act)) { // ghi chú
        const t = timeOfDay(d);
        const refType = r.weighted([['none', 50], ['word', 25], ['reading', 10], ['listening', 10], ['test', 5]]);
        let refId = null, refLabel = null;
        if (refType === 'word') { refId = r.pick(approvedWordIds); refLabel = WORDS[refId - 1].word; }
        else if (refType === 'reading') { const a = r.pick(ART); refId = a.id; refLabel = a.title; }
        else if (refType === 'listening') { const l = r.pick(LESSONS); refId = l.id; refLabel = `Bài nghe #${l.id}`; }
        else if (refType === 'test') { const s = r.pick(SETS); refId = s.id; refLabel = `${s.exam} ${s.section} #${s.id}`; }
        add('user_notes', [nid('user_notes'), uid, r.chance(0.8) ? r.pick(C.NOTE_TITLES) : null, r.pick(C.NOTE_BODIES), r.pick(C.NOTE_COLORS), r.chance(0.12) ? 1 : 0, refType, refId, refLabel, fmt(t), fmt(Math.min(NOW, t + r.int(0, 3) * DAY_MS))]);
      }
    }
    // ghi nốt log dự đoán chưa có kết quả thực tế
    for (const c of cards) if (c.pendingMl) { add('ml_prediction_logs', c.pendingMl); c.pendingMl = null; }
    // ghi thẻ với trạng thái cuối cùng
    for (const c of cards) {
      const probNow = Number(clamp(Math.pow(2, -Math.max(0, (NOW - c.last) / HOUR_MS) / c.halfLife), 0.01, 0.9999).toFixed(4));
      add('user_vocabulary_cards', [c.id, uid, c.wordId, c.ef, c.interval, c.reps, c.halfLife, probNow, fmt(c.next), fmt(c.created), fmt(c.touched)]);
    }

    // --- Streak (theo ngày có học)
    let longest = 0, run = 0, prev = -10;
    for (const d of activeDays) { run = d === prev + 1 ? run + 1 : 1; longest = Math.max(longest, run); prev = d; }
    let current = 0;
    if (lastActiveDay >= TODAY - 1) { current = 1; for (let i = activeDays.length - 2; i >= 0 && activeDays[i] === activeDays[i + 1] - 1; i -= 1) current += 1; }
    add('streaks', [nid('streaks'), uid, current, longest, dateStr(lastActiveDay), r.chance(0.02) ? dateStr(Math.min(TODAY, lastActiveDay + 3)) : null]);

    // --- Thông báo
    const remindH = r.pick(['06:30', '07:00', '07:30', '08:00', '12:00', '18:30', '20:00', '21:00', '21:30']);
    const reminderOn = vip || r.chance(0.85);
    add('notification_settings', [nid('notification_settings'), uid, `${remindH}:00`, reminderOn ? 1 : 0, r.chance(0.35) ? `ExponentPushToken[${hex(11)}]` : null]);
    const notifLast = Math.min(TODAY, lastActiveDay + 10);
    const [rh, rm] = remindH.split(':').map(Number);
    if (reminderOn) {
      for (let d = joinDay; d <= notifLast; d += 1) {
        if (!r.chance(0.5)) continue;
        const t = Math.min(dayStart(d) + rh * HOUR_MS + rm * 60000 + r.int(0, 240) * 1000, NOW - 1000);
        if (t < createdMs) continue;
        const due = r.chance(0.6);
        const read = (NOW - t) > 3 * DAY_MS ? r.chance(0.85) : r.chance(0.4);
        add('notifications', [nid('notifications'), uid, due ? 'Đến giờ ôn từ! 🔔' : 'Nhắc học từ vựng 📚', due ? `Bạn có ${r.int(3, 45)} từ cần ôn tập hôm nay.` : 'Đã đến giờ học từ mới hôm nay, vào ôn luyện ngay nhé!', due ? 'review_due' : 'daily_reminder', read ? 1 : 0, fmt(t)]);
      }
    }
    const sysTpl = C.NOTIFICATION_TEMPLATES.filter((t) => t.type !== 'review_due' && t.type !== 'daily_reminder' && t.name !== 'review_due_default');
    for (let k = r.int(1, 7); k > 0; k -= 1) {
      const tpl = r.pick(sysTpl);
      const t = Math.min(timeBetween(createdMs, NOW), NOW - 1000);
      add('notifications', [nid('notifications'), uid, tpl.title_template, tpl.body_template.replace('{{count}}', String(r.int(3, 40))), tpl.type, (NOW - t) > 3 * DAY_MS ? (r.chance(0.8) ? 1 : 0) : (r.chance(0.35) ? 1 : 0), fmt(t)]);
    }

    // --- Refresh token
    const nTok = vip ? 4 : r.int(1, 3);
    for (let k = 0; k < nTok; k += 1) {
      const d = r.pick(activeDays);
      const t = timeOfDay(d);
      const expires = t + 7 * DAY_MS;
      add('refresh_tokens', [nid('refresh_tokens'), uid, hex(32), fmt(expires), (k < nTok - 1 || expires < NOW) && r.chance(0.7) ? fmt(Math.min(NOW, t + r.int(1, 6) * DAY_MS)) : null, fmt(t)]);
    }

    // --- Đăng ký lộ trình học
    const nEnroll = r.int(0, profileName === 'dormant' ? 1 : 4);
    for (const p of r.sample(pathIds, nEnroll)) {
      const t = Math.max(timeBetween(createdMs, NOW), p.created);
      add('learning_path_enrollments', [nid('learning_path_enrollments'), uid, p.id, r.chance(0.3) ? fmt(Math.min(NOW, t + r.int(3, 40) * DAY_MS)) : null, fmt(Math.min(t, NOW))]);
    }

    // --- Gói đăng ký (≈28% học viên)
    if (vip || r.chance(0.28)) {
      const paid = C.PLANS.map((p, i) => ({ p, id: i + 1 })).filter((x) => x.p.price > 0 && x.p.duration_days < 1000);
      const nSub = r.chance(0.2) ? 2 : 1;
      let cursor = timeBetween(createdMs, NOW - DAY_MS);
      for (let k = 0; k < nSub; k += 1) {
        const plan = r.pick(paid);
        const start = Math.min(cursor, NOW - DAY_MS);
        const end = start + plan.p.duration_days * DAY_MS;
        let status = end < NOW ? 'expired' : 'active';
        if (r.chance(0.08)) status = 'cancelled';
        add('subscriptions', [nid('subscriptions'), uid, plan.id, status, new Date(start + LOCAL_OFFSET).toISOString().slice(0, 10), new Date(end + LOCAL_OFFSET).toISOString().slice(0, 10), fmt(start)]);
        cursor = end + DAY_MS;
        if (cursor > NOW) break;
      }
    }

    // --- Tài khoản
    const lastTouchMs = Math.min(NOW, Math.max(createdMs, dayStart(lastActiveDay) + 20 * HOUR_MS));
    add('users', [uid, `student${si}@engup.test`, passwordHash, vip ? (si === 1 ? 'Nguyễn Văn A' : 'Trần Thị B') : randomName(), 'student', level, goal, target, limit, isActive ? 1 : 0, fmt(createdMs), fmt(lastTouchMs)]);
    studentRecords.push({ id: uid, createdMs, active: isActive });

    if (pendingRows >= 15000) await flushAll();
    if (si % 100 === 0 || si === N_STUDENTS) {
      const secs = ((Date.now() - t0) / 1000).toFixed(0);
      const total = Object.values(COUNT).reduce((a, b) => a + b, 0);
      log(`Học viên ${si}/${N_STUDENTS} — tổng ${total.toLocaleString('vi-VN')} dòng — ${secs}s`);
    }
  }
  await flushAll();
  return { studentIds, studentRecords };
}

// ───────────────────────── Dữ liệu quản trị ─────────────────────────
async function seedAdminData(studentRecords) {
  const adm = () => r.pick(adminIds);

  // Cập nhật thời điểm cập nhật + tạo hàng đợi duyệt nhất quán với cờ is_approved
  const [unapprovedArticles] = await conn.query('SELECT id, title, created_by, created_at FROM reading_articles WHERE is_approved = 0');
  const [unapprovedWords] = await conn.query('SELECT id, word AS title, created_by, created_at FROM vocabulary_words WHERE is_approved = 0');
  const [unapprovedQuestions] = await conn.query('SELECT q.id, q.question_text AS title, s.created_at FROM test_questions q JOIN test_sets s ON s.id = q.test_set_id WHERE q.is_approved = 0');
  const [unapprovedPaths] = await conn.query('SELECT id, title, created_by, created_at FROM learning_paths WHERE is_approved = 0');
  const audit = [];
  const queueRows = [];
  const pushQueue = (type, row, forceStatus) => {
    const created = Math.min(new Date(row.created_at).getTime() + r.int(1, 10) * DAY_MS, NOW - HOUR_MS);
    const status = forceStatus || r.weighted([['pending', 70], ['rejected', 30]]);
    const reviewed = status === 'pending' ? null : Math.min(NOW, created + r.int(1, 48) * HOUR_MS);
    const reviewer = status === 'pending' ? null : adm();
    const reason = status === 'rejected' ? r.pick(['Nội dung chưa chính xác', 'Trùng với bài đã có', 'Cần sửa lỗi ngữ pháp', 'Câu hỏi chưa rõ đáp án', 'Không phù hợp trình độ']) : null;
    const id = nid('admin_content_approval_queue');
    const title = String(row.title || '').slice(0, 255);
    add('admin_content_approval_queue', [id, type, row.id, row.created_by || null, title, status, reason, reviewer, reviewed ? fmt(reviewed) : null, fmt(created)]);
    queueRows.push({ id, type, content_id: row.id });
    if (status !== 'pending') {
      add('audit_logs', [nid('audit_logs'), reviewer, status === 'approved' ? 'content.approve' : 'content.reject', type, row.id, JSONS(status === 'approved' ? { queue_id: id } : { queue_id: id, reject_reason: reason }), fmt(reviewed)]);
    }
  };
  unapprovedArticles.forEach((x) => pushQueue('reading_article', x));
  unapprovedWords.forEach((x) => pushQueue('vocabulary_word', x));
  unapprovedQuestions.forEach((x) => pushQueue('test_question', x));
  unapprovedPaths.forEach((x) => pushQueue('learning_path', x));
  // lịch sử đã duyệt (nội dung đang is_approved = 1)
  const [approvedArticles] = await conn.query('SELECT id, title, created_by, created_at FROM reading_articles WHERE is_approved = 1 AND is_ai_generated = 1 LIMIT 400');
  const [approvedPaths] = await conn.query('SELECT id, title, created_by, created_at FROM learning_paths WHERE is_approved = 1 LIMIT 40');
  approvedArticles.forEach((x) => pushQueue('reading_article', x, 'approved'));
  approvedPaths.forEach((x) => pushQueue('learning_path', x, 'approved'));
  log(`Hàng đợi duyệt: ${COUNT.admin_content_approval_queue} mục`);

  // Audit log: thao tác quản trị khác
  const span = NOW - START_MS;
  const rt = () => START_MS + Math.floor(Math.pow(r.f(), 0.8) * span);
  const nSets = SETS.length;
  const tplIds = Array.from({ length: COUNT.notification_templates }, (_, i) => i + 1);
  const planIds = Array.from({ length: COUNT.subscription_plans }, (_, i) => i + 1);
  const total = Math.max(3000, Math.round(N_STUDENTS * 6));
  const ACTIONS = [
    ['admin.login', 30, () => { const a = adm(); return [a, 'user', a, null]; }],
    ['user.status.update', 14, () => { const u = r.pick(studentRecords); const to = r.chance(0.5); return [adm(), 'user', u.id, { from: !to, to }]; }],
    ['test_set.create', 5, () => { const s = r.pick(SETS); return [adm(), 'test_set', s.id, { exam_type: s.exam, section: s.section }]; }],
    ['test_set.update', 6, () => { const s = r.pick(SETS); return [adm(), 'test_set', s.id, { changes: { time_limit_minutes: [s.limit, s.limit + 5] } }]; }],
    ['test_set.delete', 1, () => [adm(), 'test_set', nSets + r.int(1, 500), { title: 'Đề đã xoá', exam_type: r.pick(['IELTS', 'TOEIC']), deleted_questions: r.int(5, 30) }]],
    ['test_question.create', 12, () => { const s = r.pick(SETS); const q = r.pick(s.qs); return [adm(), 'test_question', q.id, { test_set_id: s.id, question_type: q.type }]; }],
    ['test_question.update', 10, () => { const s = r.pick(SETS); const q = r.pick(s.qs); return [adm(), 'test_question', q.id, { changes: { correct_answer: [q.correct, q.correct] } }]; }],
    ['test_question.delete', 2, () => [adm(), 'test_question', COUNT.test_questions + r.int(1, 999), { test_set_id: r.pick(SETS).id }]],
    ['notification_template.create', 1, () => [adm(), 'notification_template', r.pick(tplIds), { type: 'system' }]],
    ['notification_template.update', 3, () => [adm(), 'notification_template', r.pick(tplIds), { changes: { body_template: ['cũ', 'mới'] } }]],
    ['subscription_plan.update', 2, () => [adm(), 'subscription_plan', r.pick(planIds), { changes: { price: [49000, 59000] } }]],
    ['streak.run_manual', 2, () => [adm(), 'system', 0, { processed: r.int(500, N_STUDENTS), extended: r.int(100, 400), reset: r.int(10, 200) }]],
    ['notification.broadcast', 2, () => [adm(), 'system', 0, { title: r.pick(['Bảo trì hệ thống', 'Đề thi mới', 'Ưu đãi Pro']), sent: r.int(300, N_STUDENTS) }]]
  ];
  for (let i = 0; i < total; i += 1) {
    const [action, , gen] = r.weighted(ACTIONS.map((a) => [a, a[1]]));
    const [actor, ttype, tid, detail] = gen();
    add('audit_logs', [nid('audit_logs'), actor, action, ttype, tid, detail ? JSONS(detail) : null, fmt(rt())]);
  }
  log(`Audit log: ${COUNT.audit_logs} dòng`);

  // Error logs
  const nErr = Math.max(4000, N_STUDENTS * 5);
  for (let i = 0; i < nErr; i += 1) {
    const service = r.chance(0.78) ? 'backend' : 'ml-service';
    const [level, message] = r.pick(C.ERROR_MESSAGES[service]);
    add('error_logs', [nid('error_logs'), service, level, message, level === 'error' || level === 'critical' ? r.pick(C.STACKS) : null, fmt(rt())]);
  }
  log(`Error log: ${COUNT.error_logs} dòng`);

  // Lịch sử chạy job
  for (let d = 0; d <= TODAY; d += 1) {
    const base = dayStart(d);
    if (base + 10 * 60000 > NOW) break;
    const st = r.weighted([['success', 93], ['partial', 5], ['failed', 2]]);
    const total = Math.round(N_STUDENTS * r.float(0.9, 1));
    const reset = r.int(0, Math.round(total * 0.4));
    add('system_job_runs', [nid('system_job_runs'), 'streak', 'cron', st, dateStr(Math.max(0, d - 1)),
      JSONS({ total_users: total, extended: r.int(0, total - reset), reset, unchanged: r.int(0, 50) }), st === 'failed' ? 'Mất kết nối MySQL khi chạy job streak' : (st === 'partial' ? 'Một số tài khoản không cập nhật được' : null), r.int(200, 4000), fmt(base + 10 * 60000 + r.int(0, 20000))]);
    for (let k = r.int(4, 9); k > 0; k -= 1) {
      const t = base + r.int(5, 22) * HOUR_MS + r.int(0, 11) * 5 * 60000;
      if (t > NOW) continue;
      const due = r.int(1, Math.max(2, Math.round(N_STUDENTS * 0.08)));
      const failed = r.int(0, Math.round(due * 0.1));
      add('system_job_runs', [nid('system_job_runs'), 'reminder', 'cron', failed > 0 ? 'partial' : 'success', null,
        JSONS({ bucket: `${String(Math.floor((t % DAY_MS) / HOUR_MS)).padStart(2, '0')}:00`, candidates: Math.round(N_STUDENTS * 0.85), due, inapp: due, push_sent: Math.round(due * 0.35) - failed, push_failed: failed, no_token: Math.round(due * 0.65), skipped_duplicate: 0 }), null, r.int(50, 1800), fmt(t)]);
    }
    if (r.chance(0.04)) add('system_job_runs', [nid('system_job_runs'), 'broadcast', 'manual', 'success', null, JSONS({ title: 'Thông báo hệ thống', sent: Math.round(N_STUDENTS * 0.9), push_sent: Math.round(N_STUDENTS * 0.3) }), null, r.int(100, 2500), fmt(base + 9 * HOUR_MS)]);
  }
  log(`Job runs: ${COUNT.system_job_runs} dòng`);
  await flushAll();
}

// ───────────────────────── Chạy ─────────────────────────
async function main() {
  const t0 = Date.now();
  console.log(`\n⏳ SEED DỮ LIỆU THẬT: ${N_STUDENTS} học viên, ${DAYS} ngày lịch sử, density=${DENSITY}, rng=${RNG_SEED}`);
  conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'EngUp_database',
    charset: 'utf8mb4',
    multipleStatements: false
  });

  // Kiểm tra DB đang trống (chỉ có admin)
  for (const t of TABLE_ORDER) {
    if (t === 'users') continue;
    const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
    if (n > 0) throw new Error(`Bảng ${t} đã có ${n} dòng. Hãy chạy npm run app:reset:real (reset trước rồi mới seed).`);
  }
  const [admins] = await conn.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id");
  const [[{ students }]] = await conn.query("SELECT COUNT(*) AS students FROM users WHERE role <> 'admin'");
  if (admins.length < 1) throw new Error('Chưa có tài khoản admin nào trong database.');
  if (students > 0) throw new Error('Database đã có học viên. Hãy reset trước khi seed.');
  adminIds = admins.map((a) => a.id);

  // user_test_attempts.band_score: schema SQL cũ là DECIMAL(3,1), điểm TOEIC tới 990 cần DECIMAL(5,1)
  await conn.query('ALTER TABLE user_test_attempts MODIFY COLUMN band_score DECIMAL(5,1) NULL');
  await conn.query("SET SESSION sql_mode = REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', '')");

  console.log('🔐 Băm mật khẩu học viên...');
  const passwordHash = await bcrypt.hash(STUDENT_PASSWORD, 10);

  console.log('📚 Nội dung dùng chung:');
  await seedContent();

  console.log('👥 Học viên và lịch sử học tập:');
  const { studentRecords } = await seedStudents(passwordHash);

  console.log('🛠️  Dữ liệu quản trị:');
  await seedAdminData(studentRecords);

  // Bảng tổng kết
  console.log('\n📊 Số dòng từng bảng:');
  let sum = 0;
  const rows = [];
  for (const t of TABLE_ORDER) {
    const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
    sum += n;
    rows.push([t, n]);
  }
  const w = Math.max(...rows.map((x) => x[0].length));
  rows.forEach(([t, n]) => console.log(`   ${t.padEnd(w)}  ${String(n.toLocaleString('vi-VN')).padStart(11)}`));
  console.log(`   ${'TỔNG'.padEnd(w)}  ${sum.toLocaleString('vi-VN').padStart(11)}`);
  console.log(`\n🎉 Xong trong ${((Date.now() - t0) / 1000).toFixed(0)} giây.`);
  console.log(`   Học viên: student1@engup.test ... student${N_STUDENTS}@engup.test  /  ${STUDENT_PASSWORD}`);
  await conn.end();
}

main().catch(async (e) => {
  console.error('❌ Seed dữ liệu thật thất bại:', e.message);
  if (process.env.DEBUG) console.error(e);
  try { await conn.end(); } catch { /* bỏ qua */ }
  process.exit(1);
});
