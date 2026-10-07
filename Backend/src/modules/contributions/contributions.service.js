const repo = require('./contributions.repository');
const AppError = require('../../common/utils/AppError');
const { normalizeReadingQuestion } = require('../reading/reading.questions.util');

const MAX_PENDING = Number(process.env.CONTRIB_MAX_PENDING) || 20;

async function assertQuota(userId) {
  const pending = await repo.countPendingByUser(userId);
  if (pending >= MAX_PENDING) {
    throw new AppError(`Bạn đang có ${pending} đóng góp chờ duyệt (tối đa ${MAX_PENDING}). Vui lòng đợi quản trị viên duyệt bớt rồi gửi tiếp.`, 429);
  }
}

const blankToNull = (v) => {
  const s = v === undefined || v === null ? '' : String(v).trim();
  return s === '' ? null : s;
};

function toItemDto(item) {
  return {
    id: item.id,
    content_type: item.content_type,
    content_id: item.content_id,
    title: item.title || null,
    status: item.status,
    reject_reason: item.reject_reason || null,
    created_at: item.created_at,
    reviewed_at: item.reviewed_at || null
  };
}

async function submitReading(user, body) {
  await assertQuota(user.id);
  const questions = (body.questions || []).map((q, i) => normalizeReadingQuestion(q, `Câu hỏi ${i + 1}`));
  const title = body.title.trim();

  const queue = await repo.withTransaction(async (transaction) => {
    const article = await repo.createReading({
      title,
      content: body.content.trim(),
      difficulty: blankToNull(body.difficulty),
      topic: blankToNull(body.topic),
      is_ai_generated: false,
      is_approved: false,
      created_by: user.id
    }, questions, transaction);
    return repo.createQueue({ content_type: 'reading_article', content_id: article.id, submitted_by: user.id, title }, transaction);
  });
  return { ...toItemDto(queue), question_count: questions.length };
}

async function submitVocabulary(user, body) {
  await assertQuota(user.id);
  const word = body.word.trim();
  if (await repo.findWordByText(word)) {
    throw new AppError('Từ này đã có trong hệ thống hoặc đang chờ duyệt', 409);
  }
  let topicId = null;
  if (body.topic_id !== undefined && body.topic_id !== null && body.topic_id !== '') {
    const topic = await repo.findTopicById(Number(body.topic_id));
    if (!topic) throw new AppError('Chủ đề không tồn tại', 404);
    topicId = topic.id;
  }

  const queue = await repo.withTransaction(async (transaction) => {
    const created = await repo.createWord({
      word,
      meaning: body.meaning.trim(),
      phonetic: blankToNull(body.phonetic),
      example_sentence: blankToNull(body.example_sentence),
      difficulty: blankToNull(body.difficulty),
      topic_id: topicId,
      is_approved: false,
      created_by: user.id
    }, transaction);
    return repo.createQueue({ content_type: 'vocabulary_word', content_id: created.id, submitted_by: user.id, title: word }, transaction);
  });
  return toItemDto(queue);
}

async function submitTestQuestion(user, body) {
  await assertQuota(user.id);
  const testSet = await repo.findTestSetById(Number(body.test_set_id));
  if (!testSet) throw new AppError('Đề thi không tồn tại', 404);

  let options = null;
  let correct;
  if (body.question_type === 'multiple_choice') {
    const n = normalizeReadingQuestion({
      question_text: body.question_text,
      options: body.options,
      correct_answer: body.correct_answer
    }, 'Câu hỏi');
    options = n.options;
    correct = n.correct_answer;
  } else {
    correct = String(body.correct_answer).trim();
    if (!correct) throw new AppError('correct_answer là bắt buộc', 400);
  }
  const order = (await repo.maxQuestionOrder(testSet.id)) + 1;
  const text = body.question_text.trim();

  const queue = await repo.withTransaction(async (transaction) => {
    const q = await repo.createTestQuestion({
      test_set_id: testSet.id,
      question_text: text,
      question_type: body.question_type,
      options,
      correct_answer: correct,
      passage_text: blankToNull(body.passage_text),
      order_index: order,
      is_approved: false
    }, transaction);
    return repo.createQueue({ content_type: 'test_question', content_id: q.id, submitted_by: user.id, title: text.slice(0, 120) }, transaction);
  });
  return toItemDto(queue);
}

async function listMine(user) {
  const items = await repo.findMine(user.id);
  return { items: items.map(toItemDto), max_pending: MAX_PENDING };
}

async function withdraw(user, id) {
  const item = await repo.findMineById(id, user.id);
  if (!item) throw new AppError('Đóng góp không tồn tại', 404);
  if (item.status !== 'pending') throw new AppError('Chỉ rút lại được đóng góp đang chờ duyệt', 409);
  await repo.deletePending(item);
  return null;
}

module.exports = { submitReading, submitVocabulary, submitTestQuestion, listMine, withdraw, MAX_PENDING };
