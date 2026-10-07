const {
  sequelize,
  AdminContentApprovalQueue,
  AuditLog,
  Notification,
  ReadingArticle,
  ReadingQuestion,
  TestQuestion,
  TestSet,
  VocabularyWord,
  VocabularyTopic,
  User
} = require('../../common/models');

// content_id là khoá ngoại đa hình: content_type quyết định bảng nội dung tương ứng.
// Module này chỉ chạm tới cột `id` và `is_approved` của các bảng đó.
const CONTENT_MODELS = {
  reading_article: ReadingArticle,
  test_question: TestQuestion,
  vocabulary_word: VocabularyWord
};

// ---------- Transaction ----------

// Managed transaction: callback throw -> rollback, resolve -> commit.
async function withTransaction(callback) {
  return sequelize.transaction(callback);
}

// ---------- Hàng chờ duyệt (bảng do module này sở hữu) ----------

async function titleFromContent(contentType, contentId) {
  try {
    if (contentType === 'reading_article') {
      const a = await ReadingArticle.findByPk(contentId, { attributes: ['title'] });
      return a ? a.title : null;
    }
    if (contentType === 'vocabulary_word') {
      const w = await VocabularyWord.findByPk(contentId, { attributes: ['word'] });
      return w ? w.word : null;
    }
    if (contentType === 'test_question') {
      const q = await TestQuestion.findByPk(contentId, { attributes: ['question_text'] });
      return q ? String(q.question_text).slice(0, 120) : null;
    }
  } catch (err) {
    return null;
  }
  return null;
}

async function findPending({ type } = {}) {
  const where = { status: 'pending' };
  if (type) where.content_type = type;

  const rows = await AdminContentApprovalQueue.findAll({
    where,
    attributes: ['id', 'content_type', 'content_id', 'created_at', 'title', 'submitted_by'],
    include: [{ model: User, as: 'submitter', attributes: ['id', 'full_name', 'email'], required: false }],
    order: [
      ['created_at', 'ASC'], // FIFO: yêu cầu cũ nhất được duyệt trước
      ['id', 'ASC']
    ]
  });

  for (const row of rows) {
    if (!row.title) row.title = await titleFromContent(row.content_type, row.content_id);
  }
  return rows;
}

async function findQueueItemById(id) {
  return AdminContentApprovalQueue.findByPk(id, {
    include: [{ model: User, as: 'submitter', attributes: ['id', 'full_name', 'email'], required: false }]
  });
}

async function getContentDetail(contentType, contentId) {
  if (contentType === 'reading_article') {
    const a = await ReadingArticle.findByPk(contentId, { include: [{ model: ReadingQuestion, as: 'questions' }] });
    if (!a) return null;
    return {
      kind: 'reading_article',
      id: a.id,
      title: a.title,
      content: a.content,
      difficulty: a.difficulty,
      topic: a.topic,
      is_approved: a.is_approved,
      questions: (a.questions || []).sort((x, y) => x.id - y.id).map((q) => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation
      }))
    };
  }
  if (contentType === 'vocabulary_word') {
    const w = await VocabularyWord.findByPk(contentId, { include: [{ model: VocabularyTopic, as: 'topic', attributes: ['name'], required: false }] });
    if (!w) return null;
    return {
      kind: 'vocabulary_word',
      id: w.id,
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example_sentence: w.example_sentence,
      difficulty: w.difficulty,
      topic_name: w.topic ? w.topic.name : null,
      is_approved: w.is_approved
    };
  }
  if (contentType === 'test_question') {
    const q = await TestQuestion.findByPk(contentId, { include: [{ model: TestSet, as: 'testSet', attributes: ['id', 'title', 'exam_type', 'section'], required: false }] });
    if (!q) return null;
    return {
      kind: 'test_question',
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      passage_text: q.passage_text,
      audio_url: q.audio_url,
      is_approved: q.is_approved,
      test_set: q.testSet ? { id: q.testSet.id, title: q.testSet.title, exam_type: q.testSet.exam_type, section: q.testSet.section } : null
    };
  }
  return null;
}

// Khoá dòng (SELECT ... FOR UPDATE) để hai admin bấm duyệt cùng lúc không xử lý trùng.
async function findQueueItemForUpdate(id, transaction) {
  return AdminContentApprovalQueue.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
}

async function markQueueItemReviewed(item, { status, reviewedBy, rejectReason = null }, transaction) {
  return item.update(
    {
      status,
      reject_reason: rejectReason,
      reviewed_by: reviewedBy,
      reviewed_at: new Date()
    },
    { transaction }
  );
}

// ---------- Bảng nội dung (tham chiếu qua content_id) ----------

async function contentExists(contentType, contentId, transaction) {
  const Model = CONTENT_MODELS[contentType];
  if (!Model) return false;

  const row = await Model.findByPk(contentId, { attributes: ['id'], transaction });
  return Boolean(row);
}

async function setContentApproved(contentType, contentId, transaction) {
  const Model = CONTENT_MODELS[contentType];
  if (!Model) return;

  await Model.update({ is_approved: true }, { where: { id: contentId }, transaction });
}


async function createNotification({ user_id, title, body, type }, transaction) {
  return Notification.create({ user_id, title, body, type }, { transaction });
}

// ---------- Audit log (bảng do Admin sở hữu) ----------

async function createAuditLog({ actor_id, action, target_type, target_id, detail = null }, transaction) {
  return AuditLog.create({ actor_id, action, target_type, target_id, detail }, { transaction });
}

module.exports = {
  withTransaction,
  findPending,
  findQueueItemById,
  getContentDetail,
  createNotification,
  findQueueItemForUpdate,
  markQueueItemReviewed,
  contentExists,
  setContentApproved,
  createAuditLog
};
