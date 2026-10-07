const { Op } = require('sequelize');
const {
  sequelize,
  LearningPath,
  LearningPathItem,
  LearningPathEnrollment,
  AdminContentApprovalQueue,
  VocabularyWord,
  VocabularyTopic,
  ReadingArticle,
  ListeningLesson,
  UserVocabularyCard,
  ReviewLog,
  ReadingAttempt,
  ListeningDictationAttempt,
  User
} = require('../../common/models');
const AppError = require('../../common/utils/AppError');

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const ITEM_TYPES = ['word', 'reading', 'listening'];
const MAX_ITEMS = 300;
const MAX_PENDING_PATHS = Number(process.env.MAX_PENDING_PATHS) || 5;
const MASTERY_INTERVAL_DAYS = 21;

const isAdmin = (u) => u && u.role === 'admin';

function gradeOf(completion, mastery, total) {
  if (!total) return { key: 'empty', label: 'Chưa có nội dung' };
  if (completion === 0) return { key: 'not_started', label: 'Chưa bắt đầu' };
  if (completion < 100) return { key: 'in_progress', label: completion >= 60 ? 'Đang học khá tốt' : 'Đang học' };
  if (mastery >= 80) return { key: 'excellent', label: 'Hoàn thành xuất sắc' };
  if (mastery >= 60) return { key: 'good', label: 'Hoàn thành tốt' };
  return { key: 'completed', label: 'Hoàn thành, cần ôn thêm' };
}

async function loadContent(items) {
  const ids = { word: [], reading: [], listening: [] };
  items.forEach((i) => ids[i.item_type].push(Number(i.item_id)));
  const [words, readings, listenings] = await Promise.all([
    ids.word.length ? VocabularyWord.findAll({ where: { id: ids.word, is_approved: true }, raw: true }) : [],
    ids.reading.length ? ReadingArticle.findAll({ where: { id: ids.reading, is_approved: true }, attributes: ['id', 'title', 'difficulty', 'topic'], raw: true }) : [],
    ids.listening.length ? ListeningLesson.findAll({ where: { id: ids.listening }, attributes: ['id', 'title', 'difficulty', 'topic'], raw: true }) : []
  ]);
  const map = new Map();
  words.forEach((w) => map.set(`word:${w.id}`, { title: w.word, subtitle: w.meaning, phonetic: w.phonetic, difficulty: w.difficulty, topic_id: w.topic_id }));
  readings.forEach((r) => map.set(`reading:${r.id}`, { title: r.title, subtitle: r.topic, difficulty: r.difficulty }));
  listenings.forEach((l) => map.set(`listening:${l.id}`, { title: l.title, subtitle: l.topic, difficulty: l.difficulty }));
  return map;
}

async function describeItems(items) {
  const content = await loadContent(items);
  return items.map((i) => ({
    item_type: i.item_type,
    item_id: Number(i.item_id),
    order_index: i.order_index,
    missing: !content.has(`${i.item_type}:${i.item_id}`),
    ...(content.get(`${i.item_type}:${i.item_id}`) || { title: null, subtitle: null })
  }));
}

async function computeProgress(userId, items) {
  const described = await describeItems(items);
  const live = described.filter((i) => !i.missing);
  const idsOf = (t) => live.filter((i) => i.item_type === t).map((i) => i.item_id);

  const [cards, reviewed, readings, listenings] = await Promise.all([
    idsOf('word').length ? UserVocabularyCard.findAll({ where: { user_id: userId, word_id: idsOf('word') }, attributes: ['word_id', 'interval_days', 'repetitions'], raw: true }) : [],
    idsOf('word').length ? ReviewLog.findAll({ where: { user_id: userId, word_id: idsOf('word') }, attributes: ['word_id'], group: ['word_id'], raw: true }) : [],
    idsOf('reading').length ? ReadingAttempt.findAll({ where: { user_id: userId, article_id: idsOf('reading') }, attributes: ['article_id', 'score'], raw: true }) : [],
    idsOf('listening').length ? ListeningDictationAttempt.findAll({ where: { user_id: userId, lesson_id: idsOf('listening') }, attributes: ['lesson_id', 'accuracy_percent'], raw: true }) : []
  ]);

  const cardBy = new Map(cards.map((c) => [Number(c.word_id), c]));
  const reviewedSet = new Set(reviewed.map((r) => Number(r.word_id)));
  const readBest = new Map();
  readings.forEach((r) => readBest.set(Number(r.article_id), Math.max(readBest.get(Number(r.article_id)) || 0, Number(r.score))));
  const listenBest = new Map();
  listenings.forEach((l) => listenBest.set(Number(l.lesson_id), Math.max(listenBest.get(Number(l.lesson_id)) || 0, Number(l.accuracy_percent))));

  const result = described.map((i) => {
    if (i.missing) return { ...i, done: false, mastery: 0 };
    if (i.item_type === 'word') {
      const card = cardBy.get(i.item_id);
      const done = reviewedSet.has(i.item_id);
      const mastery = card && done ? Math.min(Number(card.interval_days) / MASTERY_INTERVAL_DAYS, 1) : 0;
      return { ...i, done, mastery: Number(mastery.toFixed(2)), in_review: !!card };
    }
    if (i.item_type === 'reading') {
      const best = readBest.get(i.item_id);
      return { ...i, done: best !== undefined, mastery: best !== undefined ? Number((best / 100).toFixed(2)) : 0, best_score: best ?? null };
    }
    const best = listenBest.get(i.item_id);
    return { ...i, done: best !== undefined, mastery: best !== undefined ? Number((best / 100).toFixed(2)) : 0, best_score: best ?? null };
  });

  const total = result.filter((i) => !i.missing).length;
  const done = result.filter((i) => i.done).length;
  const completion = total ? Math.round((done / total) * 100) : 0;
  const mastery = total ? Math.round((result.reduce((s, i) => s + i.mastery, 0) / total) * 100) : 0;
  const byType = {};
  ITEM_TYPES.forEach((t) => {
    const list = result.filter((i) => i.item_type === t && !i.missing);
    byType[t] = { total: list.length, done: list.filter((i) => i.done).length };
  });

  return { items: result, summary: { total, done, completion_percent: completion, mastery_percent: mastery, by_type: byType, grade: gradeOf(completion, mastery, total) } };
}

async function normalizeItems(body) {
  const raw = Array.isArray(body.items) ? body.items : [];
  const seen = new Set();
  const list = [];
  for (const it of raw) {
    if (!it || !ITEM_TYPES.includes(it.item_type) || !Number.isInteger(Number(it.item_id)) || Number(it.item_id) <= 0) {
      throw new AppError('Mỗi mục cần item_type (word|reading|listening) và item_id hợp lệ', 400);
    }
    const key = `${it.item_type}:${Number(it.item_id)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({ item_type: it.item_type, item_id: Number(it.item_id) });
  }

  if (Array.isArray(body.topic_ids)) {
    for (const topicId of body.topic_ids) {
      const words = await VocabularyWord.findAll({ where: { topic_id: Number(topicId), is_approved: true }, attributes: ['id'], order: [['id', 'ASC']], raw: true });
      for (const w of words) {
        const key = `word:${w.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ item_type: 'word', item_id: Number(w.id) });
      }
    }
  }

  if (list.length > MAX_ITEMS) throw new AppError(`Một lộ trình tối đa ${MAX_ITEMS} mục`, 400);
  const content = await loadContent(list);
  const missing = list.filter((i) => !content.has(`${i.item_type}:${i.item_id}`));
  if (missing.length) {
    throw new AppError(`Có ${missing.length} mục không tồn tại hoặc chưa được duyệt: ${missing.slice(0, 5).map((m) => `${m.item_type}#${m.item_id}`).join(', ')}`, 400);
  }
  return list;
}

function checkFields(body, { partial }) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) errors.push('title là bắt buộc');
    else if (body.title.trim().length > 255) errors.push('title tối đa 255 ký tự');
  }
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') errors.push('description phải là chuỗi');
    else if (body.description.length > 3000) errors.push('description tối đa 3000 ký tự');
  }
  if (body.level !== undefined && body.level !== null && body.level !== '' && !CEFR.includes(body.level)) errors.push(`level phải là một trong: ${CEFR.join(', ')}`);
  if (errors.length) throw new AppError(errors.join('; '), 400);
}

async function latestQueue(pathId) {
  return AdminContentApprovalQueue.findOne({ where: { content_type: 'learning_path', content_id: pathId }, order: [['id', 'DESC']] });
}

async function statusOf(path) {
  if (path.is_approved) return { status: 'approved', reject_reason: null };
  const q = await latestQueue(path.id);
  if (q && q.status === 'rejected') return { status: 'rejected', reject_reason: q.reject_reason || null };
  return { status: 'pending', reject_reason: null };
}

async function ensureCards(userId, items) {
  const wordIds = items.filter((i) => i.item_type === 'word').map((i) => Number(i.item_id));
  if (!wordIds.length) return 0;
  const existing = await UserVocabularyCard.findAll({ where: { user_id: userId, word_id: wordIds }, attributes: ['word_id'], raw: true });
  const have = new Set(existing.map((c) => Number(c.word_id)));
  const fresh = wordIds.filter((id) => !have.has(id));
  if (fresh.length) await UserVocabularyCard.bulkCreate(fresh.map((id) => ({ user_id: userId, word_id: id })));
  return fresh.length;
}

async function counts(pathIds) {
  if (!pathIds.length) return new Map();
  const rows = await LearningPathItem.findAll({ where: { path_id: pathIds }, attributes: ['path_id', 'item_type'], raw: true });
  const map = new Map();
  rows.forEach((r) => {
    const c = map.get(Number(r.path_id)) || { word: 0, reading: 0, listening: 0, total: 0 };
    c[r.item_type] += 1;
    c.total += 1;
    map.set(Number(r.path_id), c);
  });
  return map;
}

function toListDto(path, extra) {
  return {
    id: path.id,
    title: path.title,
    description: path.description,
    level: path.level,
    created_by: path.created_by,
    creator_name: path.creator ? (path.creator.full_name || path.creator.email) : null,
    is_official: !path.creator || path.creator.role === 'admin',
    is_approved: !!path.is_approved,
    created_at: path.created_at,
    ...extra
  };
}

async function listPaths(user, { scope = 'discover', q, level } = {}) {
  const where = {};
  const include = [{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email', 'role'], required: false }];
  if (q) where.title = { [Op.like]: `%${String(q).replace(/[\\%_]/g, (m) => `\\${m}`)}%` };
  if (level) where.level = level;

  let enrolledIds = null;
  if (scope === 'mine') where.created_by = user.id;
  else if (scope === 'enrolled') {
    const rows = await LearningPathEnrollment.findAll({ where: { user_id: user.id }, attributes: ['path_id'], raw: true });
    enrolledIds = rows.map((r) => Number(r.path_id));
    where.id = enrolledIds.length ? enrolledIds : 0;
  } else where.is_approved = true;

  const paths = await LearningPath.findAll({ where, include, order: [['created_at', 'DESC']], limit: 100 });
  const ids = paths.map((p) => p.id);
  const [countMap, myEnrollments] = await Promise.all([
    counts(ids),
    ids.length ? LearningPathEnrollment.findAll({ where: { user_id: user.id, path_id: ids }, raw: true }) : []
  ]);
  const enrolledSet = new Set(myEnrollments.map((e) => Number(e.path_id)));

  const out = [];
  for (const p of paths) {
    const c = countMap.get(Number(p.id)) || { word: 0, reading: 0, listening: 0, total: 0 };
    const enrolled = enrolledSet.has(Number(p.id));
    let progress = null;
    if (enrolled || scope === 'mine') {
      const items = await LearningPathItem.findAll({ where: { path_id: p.id }, order: [['order_index', 'ASC']] });
      progress = (await computeProgress(user.id, items)).summary;
    }
    const st = scope === 'mine' ? await statusOf(p) : { status: 'approved', reject_reason: null };
    out.push(toListDto(p, { item_counts: c, enrolled, progress, ...st }));
  }
  return { paths: out };
}

async function assertCanView(user, path) {
  if (path.is_approved || isAdmin(user) || Number(path.created_by) === Number(user.id)) return;
  throw new AppError('Lộ trình không tồn tại', 404);
}

async function getPath(user, id) {
  const path = await LearningPath.findByPk(id, { include: [{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email', 'role'], required: false }] });
  if (!path) throw new AppError('Lộ trình không tồn tại', 404);
  await assertCanView(user, path);
  const items = await LearningPathItem.findAll({ where: { path_id: path.id }, order: [['order_index', 'ASC'], ['id', 'ASC']] });
  const progress = await computeProgress(user.id, items);
  const enrollment = await LearningPathEnrollment.findOne({ where: { user_id: user.id, path_id: path.id } });
  if (enrollment && !enrollment.completed_at && progress.summary.total > 0 && progress.summary.completion_percent === 100) {
    await enrollment.update({ completed_at: new Date() });
  }
  const st = await statusOf(path);
  const owner = Number(path.created_by) === Number(user.id);
  return {
    ...toListDto(path, { item_counts: (await counts([path.id])).get(Number(path.id)) || { word: 0, reading: 0, listening: 0, total: 0 } }),
    ...st,
    enrolled: !!enrollment,
    completed_at: enrollment ? enrollment.completed_at : null,
    can_edit: isAdmin(user) || (owner && !path.is_approved),
    can_delete: isAdmin(user) || owner,
    items: progress.items,
    progress: progress.summary
  };
}

async function createPath(user, body) {
  checkFields(body, { partial: false });
  const items = await normalizeItems(body);
  const admin = isAdmin(user);

  if (!admin) {
    const pending = await LearningPath.count({ where: { created_by: user.id, is_approved: false } });
    if (pending >= MAX_PENDING_PATHS) {
      throw new AppError(`Bạn đang có ${pending} lộ trình chờ duyệt (tối đa ${MAX_PENDING_PATHS}). Hãy đợi quản trị viên duyệt bớt.`, 429);
    }
  }

  const path = await sequelize.transaction(async (transaction) => {
    const created = await LearningPath.create({
      title: body.title.trim(),
      description: body.description ? body.description.trim() : null,
      level: body.level || null,
      created_by: user.id,
      is_approved: admin
    }, { transaction });
    if (items.length) {
      await LearningPathItem.bulkCreate(items.map((i, idx) => ({ ...i, path_id: created.id, order_index: idx + 1 })), { transaction });
    }
    if (!admin) {
      await AdminContentApprovalQueue.create({
        content_type: 'learning_path',
        content_id: created.id,
        status: 'pending',
        submitted_by: user.id,
        title: created.title.slice(0, 255)
      }, { transaction });
    }
    return created;
  });
  return getPath(user, path.id);
}

async function updatePath(user, id, body) {
  const path = await LearningPath.findByPk(id);
  if (!path) throw new AppError('Lộ trình không tồn tại', 404);
  const owner = Number(path.created_by) === Number(user.id);
  if (!isAdmin(user)) {
    if (!owner) throw new AppError('Bạn không có quyền sửa lộ trình này', 403);
    if (path.is_approved) throw new AppError('Lộ trình đã được duyệt nên không thể sửa. Hãy tạo lộ trình mới nếu cần thay đổi.', 409);
  }
  checkFields(body, { partial: true });
  const items = body.items !== undefined || body.topic_ids !== undefined ? await normalizeItems(body) : null;

  await sequelize.transaction(async (transaction) => {
    const patch = {};
    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.description !== undefined) patch.description = body.description ? body.description.trim() : null;
    if (body.level !== undefined) patch.level = body.level || null;
    if (Object.keys(patch).length) await path.update(patch, { transaction });
    if (items) {
      await LearningPathItem.destroy({ where: { path_id: path.id }, transaction });
      if (items.length) await LearningPathItem.bulkCreate(items.map((i, idx) => ({ ...i, path_id: path.id, order_index: idx + 1 })), { transaction });
    }
    if (!isAdmin(user) && !path.is_approved) {
      const q = await AdminContentApprovalQueue.findOne({ where: { content_type: 'learning_path', content_id: path.id }, order: [['id', 'DESC']], transaction });
      if (!q || q.status === 'rejected') {
        await AdminContentApprovalQueue.create({ content_type: 'learning_path', content_id: path.id, status: 'pending', submitted_by: user.id, title: path.title.slice(0, 255) }, { transaction });
      } else if (patch.title) {
        await q.update({ title: patch.title.slice(0, 255) }, { transaction });
      }
    }
  });
  return getPath(user, path.id);
}

async function deletePath(user, id) {
  const path = await LearningPath.findByPk(id);
  if (!path) throw new AppError('Lộ trình không tồn tại', 404);
  if (!isAdmin(user) && Number(path.created_by) !== Number(user.id)) throw new AppError('Bạn không có quyền xóa lộ trình này', 403);
  await sequelize.transaction(async (transaction) => {
    await LearningPathItem.destroy({ where: { path_id: path.id }, transaction });
    await LearningPathEnrollment.destroy({ where: { path_id: path.id }, transaction });
    await AdminContentApprovalQueue.destroy({ where: { content_type: 'learning_path', content_id: path.id, status: 'pending' }, transaction });
    await path.destroy({ transaction });
  });
  return null;
}

async function enroll(user, id) {
  const path = await LearningPath.findByPk(id);
  if (!path || !path.is_approved) throw new AppError('Lộ trình không tồn tại hoặc chưa được duyệt', 404);
  await LearningPathEnrollment.findOrCreate({ where: { user_id: user.id, path_id: path.id }, defaults: { user_id: user.id, path_id: path.id } });
  const items = await LearningPathItem.findAll({ where: { path_id: path.id } });
  const added = await ensureCards(user.id, items);
  const detail = await getPath(user, path.id);
  return { ...detail, cards_added: added };
}

async function leave(user, id) {
  const removed = await LearningPathEnrollment.destroy({ where: { user_id: user.id, path_id: id } });
  if (!removed) throw new AppError('Bạn chưa tham gia lộ trình này', 404);
  return null;
}

async function adminList(requester, { status, q } = {}) {
  if (!isAdmin(requester)) throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  const where = {};
  if (status === 'approved') where.is_approved = true;
  if (status === 'pending') where.is_approved = false;
  if (q) where.title = { [Op.like]: `%${String(q).replace(/[\\%_]/g, (m) => `\\${m}`)}%` };

  const paths = await LearningPath.findAll({ where, include: [{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email', 'role'], required: false }], order: [['created_at', 'DESC']], limit: 200 });
  const ids = paths.map((p) => p.id);
  const countMap = await counts(ids);
  const enrollments = ids.length ? await LearningPathEnrollment.findAll({ where: { path_id: ids }, raw: true }) : [];

  const out = [];
  for (const p of paths) {
    const mine = enrollments.filter((e) => Number(e.path_id) === Number(p.id));
    let avg = null;
    let completed = 0;
    if (mine.length) {
      const items = await LearningPathItem.findAll({ where: { path_id: p.id } });
      const sample = mine.slice(0, 100);
      let sum = 0;
      for (const e of sample) {
        const prog = (await computeProgress(e.user_id, items)).summary;
        sum += prog.completion_percent;
        if (prog.total > 0 && prog.completion_percent === 100) completed += 1;
      }
      avg = Math.round(sum / sample.length);
    }
    const st = await statusOf(p);
    out.push(toListDto(p, {
      item_counts: countMap.get(Number(p.id)) || { word: 0, reading: 0, listening: 0, total: 0 },
      learners: mine.length,
      completed_learners: completed,
      avg_completion_percent: avg,
      ...st
    }));
  }
  return { paths: out };
}

module.exports = { listPaths, getPath, createPath, updatePath, deletePath, enroll, leave, adminList, describeItems, computeProgress, gradeOf };
