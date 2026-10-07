const { Op, fn, col } = require('sequelize');
const { sequelize, PlacementQuestion, PlacementTestResult, User, AuditLog } = require('../../common/models');
const AppError = require('../../common/utils/AppError');
const { LEVEL_THRESHOLDS } = require('../auth/placementTest.data');

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f'];
const RECOMMENDED_MIN_ACTIVE = 6;

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
}

function normalizeOptions(options, correct) {
  const texts = options.map((o) => String((o && typeof o === 'object') ? o.text : o).trim());
  if (new Set(texts.map((t) => t.toLowerCase())).size !== texts.length) throw new AppError('Các đáp án không được trùng nhau', 400);
  const normalized = texts.map((text, i) => ({ id: OPTION_IDS[i], text }));

  const raw = String(correct).trim();
  let correctId = raw.toLowerCase();
  if (!normalized.some((o) => o.id === correctId)) {
    const byText = normalized.find((o) => o.text.toLowerCase() === raw.toLowerCase());
    const byOldId = options.findIndex((o) => o && typeof o === 'object' && String(o.id).toLowerCase() === raw.toLowerCase());
    if (byText) correctId = byText.id;
    else if (byOldId >= 0) correctId = OPTION_IDS[byOldId];
    else throw new AppError(`correct_option_id phải là một trong: ${normalized.map((o) => o.id).join(', ')}`, 400);
  }
  return { options: normalized, correct_option_id: correctId };
}

const toDto = (q) => ({
  id: q.id,
  level: q.level,
  question_text: q.question_text,
  options: q.options,
  correct_option_id: q.correct_option_id,
  order_index: q.order_index,
  is_active: !!q.is_active,
  created_at: q.created_at,
  updated_at: q.updated_at
});

async function audit(requester, action, id, detail) {
  try {
    await AuditLog.create({ actor_id: requester.id, action, target_type: 'placement_question', target_id: id, detail });
  } catch (err) {
    console.error('Không ghi được audit log placement:', err.message);
  }
}

function buildHealth(rows) {
  const active = rows.filter((q) => q.is_active);
  const perLevel = Object.fromEntries(CEFR.map((l) => [l, active.filter((q) => q.level === l).length]));
  const warnings = [];
  if (active.length === 0) warnings.push('Không có câu hỏi nào đang bật: người dùng sẽ không làm được bài test đầu vào.');
  else if (active.length < RECOMMENDED_MIN_ACTIVE) warnings.push(`Chỉ có ${active.length} câu đang bật (khuyến nghị tối thiểu ${RECOMMENDED_MIN_ACTIVE}) nên kết quả xếp trình độ kém tin cậy.`);
  const empty = CEFR.filter((l) => perLevel[l] === 0);
  if (active.length && empty.length) warnings.push(`Chưa có câu hỏi cho mức: ${empty.join(', ')}. Người dùng giỏi sẽ khó được xếp đúng mức cao.`);
  return { active_count: active.length, total_count: rows.length, per_level: perLevel, warnings, thresholds: LEVEL_THRESHOLDS };
}

async function listQuestions(requester) {
  assertAdmin(requester);
  const rows = await PlacementQuestion.findAll({ order: [['order_index', 'ASC'], ['id', 'ASC']] });
  return { questions: rows.map(toDto), health: buildHealth(rows) };
}

async function createQuestion(requester, body) {
  assertAdmin(requester);
  const { options, correct_option_id } = normalizeOptions(body.options, body.correct_option_id);
  let order = body.order_index;
  if (order === undefined) {
    const max = await PlacementQuestion.max('order_index');
    order = (Number.isFinite(Number(max)) ? Number(max) : 0) + 1;
  }
  const q = await PlacementQuestion.create({
    level: body.level,
    question_text: body.question_text.trim(),
    options,
    correct_option_id,
    order_index: Number(order),
    is_active: body.is_active === undefined ? true : body.is_active
  });
  await audit(requester, 'placement_question.create', q.id, { level: q.level });
  return toDto(q);
}

async function countActive(excludeId) {
  const where = { is_active: true };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return PlacementQuestion.count({ where });
}

async function updateQuestion(requester, id, body) {
  assertAdmin(requester);
  const q = await PlacementQuestion.findByPk(id);
  if (!q) throw new AppError('Câu hỏi không tồn tại', 404);

  const patch = {};
  if (body.level !== undefined) patch.level = body.level;
  if (body.question_text !== undefined) patch.question_text = body.question_text.trim();
  if (body.options !== undefined || body.correct_option_id !== undefined) {
    const opts = body.options !== undefined ? body.options : q.options;
    const correct = body.correct_option_id !== undefined ? body.correct_option_id : q.correct_option_id;
    Object.assign(patch, normalizeOptions(opts, correct));
  }
  if (body.order_index !== undefined) patch.order_index = Number(body.order_index);
  if (body.is_active !== undefined) {
    if (body.is_active === false && q.is_active && (await countActive(q.id)) === 0) {
      throw new AppError('Phải còn ít nhất 1 câu hỏi đang bật để người dùng làm bài test đầu vào', 409);
    }
    patch.is_active = body.is_active;
  }
  await q.update(patch);
  await audit(requester, 'placement_question.update', q.id, { changed_fields: Object.keys(patch) });
  return toDto(q);
}

async function deleteQuestion(requester, id) {
  assertAdmin(requester);
  const q = await PlacementQuestion.findByPk(id);
  if (!q) throw new AppError('Câu hỏi không tồn tại', 404);
  if (q.is_active && (await countActive(q.id)) === 0) {
    throw new AppError('Không thể xoá câu hỏi đang bật cuối cùng của bài test đầu vào', 409);
  }
  await q.destroy();
  await audit(requester, 'placement_question.delete', id, { level: q.level });
  return null;
}

async function getStats(requester) {
  assertAdmin(requester);
  const [total, byLevel, recent] = await Promise.all([
    PlacementTestResult.count(),
    PlacementTestResult.findAll({ attributes: ['suggested_level', [fn('COUNT', col('id')), 'count']], group: ['suggested_level'], raw: true }),
    PlacementTestResult.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'], required: false }]
    })
  ]);
  const levels = Object.fromEntries(CEFR.map((l) => [l, 0]));
  byLevel.forEach((r) => { levels[r.suggested_level] = Number(r.count); });
  return {
    total_results: total,
    by_level: levels,
    recent: recent.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      user_name: r.user ? (r.user.full_name || r.user.email) : null,
      suggested_level: r.suggested_level,
      created_at: r.created_at
    }))
  };
}

module.exports = { listQuestions, createQuestion, updateQuestion, deleteQuestion, getStats, normalizeOptions, buildHealth };
