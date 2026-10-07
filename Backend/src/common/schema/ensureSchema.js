const db = require('../models');
const { PLACEMENT_TEST_QUESTIONS } = require('../../modules/auth/placementTest.data');

const QUEUE_TYPES = ['reading_article', 'test_question', 'vocabulary_word'];

async function tableColumns(qi, table) {
  try {
    return await qi.describeTable(table);
  } catch {
    return null;
  }
}

async function addColumnIfMissing(qi, table, column, definition) {
  const cols = await tableColumns(qi, table);
  if (!cols) return false;
  if (cols[column]) return false;
  await qi.addColumn(table, column, definition);
  return true;
}

async function ensureSchema({ log = console.log } = {}) {
  const { sequelize, Sequelize } = db;
  const qi = sequelize.getQueryInterface();
  const changes = [];

  for (const name of ['UserNote', 'PlacementQuestion', 'SystemJobRun']) {
    const model = db[name];
    const existed = await tableColumns(qi, model.getTableName());
    await model.sync();
    if (!existed) changes.push(`tạo bảng ${model.getTableName()}`);
  }

  if (await addColumnIfMissing(qi, 'vocabulary_words', 'is_approved', {
    type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true
  })) changes.push('vocabulary_words.is_approved');
  if (await addColumnIfMissing(qi, 'vocabulary_words', 'created_by', {
    type: Sequelize.BIGINT.UNSIGNED, allowNull: true
  })) changes.push('vocabulary_words.created_by');
  if (await addColumnIfMissing(qi, 'admin_content_approval_queue', 'submitted_by', {
    type: Sequelize.BIGINT.UNSIGNED, allowNull: true
  })) changes.push('admin_content_approval_queue.submitted_by');
  if (await addColumnIfMissing(qi, 'admin_content_approval_queue', 'title', {
    type: Sequelize.STRING(255), allowNull: true
  })) changes.push('admin_content_approval_queue.title');
  if (await addColumnIfMissing(qi, 'test_questions', 'is_approved', {
    type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true
  })) changes.push('test_questions.is_approved');

  const queueCols = await tableColumns(qi, 'admin_content_approval_queue');
  if (queueCols && queueCols.content_type && !String(queueCols.content_type.type).includes('vocabulary_word')) {
    const list = QUEUE_TYPES.map((t) => `'${t}'`).join(',');
    await sequelize.query(`ALTER TABLE admin_content_approval_queue MODIFY COLUMN content_type ENUM(${list}) NOT NULL`);
    changes.push('admin_content_approval_queue.content_type (+vocabulary_word)');
  }

  const total = await db.PlacementQuestion.count();
  if (total === 0) {
    await db.PlacementQuestion.bulkCreate(PLACEMENT_TEST_QUESTIONS.map((q, i) => ({
      level: q.level,
      question_text: q.question_text,
      options: q.options.map(({ id, text }) => ({ id, text })),
      correct_option_id: q.correct_option_id,
      order_index: i + 1,
      is_active: true
    })));
    changes.push(`nạp ${PLACEMENT_TEST_QUESTIONS.length} câu hỏi placement mặc định`);
  }

  if (changes.length) log(`🛠️  ensureSchema: ${changes.join('; ')}`);
  return changes;
}

module.exports = { ensureSchema };

if (require.main === module) {
  require('dotenv').config();
  ensureSchema()
    .then((c) => { console.log(c.length ? '✅ Đã cập nhật cấu trúc DB.' : '✅ DB đã đủ cấu trúc.'); process.exit(0); })
    .catch((e) => { console.error('❌ ensureSchema thất bại:', e); process.exit(1); });
}
