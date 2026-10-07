/**
 * Helper cho test/test_api.py — tạo / kiểm tra / dọn dữ liệu thử của module admin-approval.
 * (Hiện chưa có API nào để "gửi nội dung vào hàng chờ duyệt" ngoài POST /reading/generate
 *  cần AI thật, nên test tạo thẳng dữ liệu vào DB.)
 *
 * Giao thức: đọc JSON từ stdin, in ra đúng 1 dòng JSON cuối cùng trên stdout.
 *
 *   echo "{}"                       | node test/helpers/approval_fixtures.js create
 *   echo '{"queue_ids":[1,2]}'      | node test/helpers/approval_fixtures.js inspect
 *   echo '<JSON của lệnh create>'   | node test/helpers/approval_fixtures.js cleanup
 */
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env'), quiet: true });

const db = require('../../src/common/models');

const TAG = '[TEST-APPROVAL]';

async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

async function create() {
  const suffix = `${Date.now()}`;
  const [testSet] = await db.TestSet.findOrCreate({
    where: { title: `${TAG} Test set` },
    defaults: { exam_type: 'TOEIC', section: 'Reading', title: `${TAG} Test set`, time_limit_minutes: 10 }
  });

  const result = { test_set_id: testSet.id, articles: [], questions: [] };

  for (let i = 1; i <= 2; i += 1) {
    const article = await db.ReadingArticle.create({
      title: `${TAG} Article ${suffix}-${i}`,
      content: 'This article is created by the approval test and waits for admin review.',
      difficulty: 'B1',
      topic: 'Test',
      is_ai_generated: true,
      is_approved: false,
      created_by: null
    });
    await db.ReadingQuestion.create({
      article_id: article.id,
      question_text: 'Who reviews this article?',
      options: ['A. An admin', 'B. Nobody', 'C. A student', 'D. A robot'],
      correct_answer: 'A',
      explanation: 'Fixture'
    });
    const queue = await db.AdminContentApprovalQueue.create({
      content_type: 'reading_article',
      content_id: article.id,
      status: 'pending'
    });
    result.articles.push({ content_id: article.id, queue_id: queue.id });
  }

  for (let i = 1; i <= 2; i += 1) {
    const question = await db.TestQuestion.create({
      test_set_id: testSet.id,
      question_text: `${TAG} Question ${suffix}-${i}`,
      question_type: 'multiple_choice',
      options: ['A. one', 'B. two', 'C. three', 'D. four'],
      correct_answer: 'A',
      order_index: i,
      is_approved: false
    });
    const queue = await db.AdminContentApprovalQueue.create({
      content_type: 'test_question',
      content_id: question.id,
      status: 'pending'
    });
    result.questions.push({ content_id: question.id, queue_id: queue.id });
  }

  return result;
}

async function inspect({ queue_ids: queueIds = [] }) {
  const out = {};
  for (const queueId of queueIds) {
    const row = await db.AdminContentApprovalQueue.findByPk(queueId);
    if (!row) {
      out[queueId] = null;
      continue;
    }

    const Model = row.content_type === 'reading_article' ? db.ReadingArticle : db.TestQuestion;
    const content = await Model.findByPk(row.content_id);
    const auditCount = await db.AuditLog.count({
      where: { target_type: row.content_type, target_id: row.content_id, action: ['content.approve', 'content.reject'] }
    });

    out[queueId] = {
      status: row.status,
      reject_reason: row.reject_reason,
      reviewed_by: row.reviewed_by,
      reviewed_at_set: row.reviewed_at !== null,
      content_is_approved: content ? Boolean(content.is_approved) : null,
      audit_count: auditCount
    };
  }
  return out;
}

async function cleanup(fixture) {
  const articleIds = (fixture.articles || []).map((a) => a.content_id);
  const questionIds = (fixture.questions || []).map((q) => q.content_id);
  const queueIds = [...(fixture.articles || []), ...(fixture.questions || [])].map((x) => x.queue_id);

  await db.AuditLog.destroy({ where: { target_type: 'reading_article', target_id: articleIds } });
  await db.AuditLog.destroy({ where: { target_type: 'test_question', target_id: questionIds } });
  await db.AdminContentApprovalQueue.destroy({ where: { id: queueIds } });
  await db.ReadingArticle.destroy({ where: { id: articleIds } }); // reading_questions xoá theo (CASCADE)
  await db.TestQuestion.destroy({ where: { id: questionIds } });

  if (fixture.test_set_id) {
    const remaining = await db.TestQuestion.count({ where: { test_set_id: fixture.test_set_id } });
    if (remaining === 0) await db.TestSet.destroy({ where: { id: fixture.test_set_id } });
  }
  return { cleaned: true };
}

(async () => {
  const mode = process.argv[2];
  let exitCode = 0;
  try {
    const input = await readStdinJson();
    let output;
    if (mode === 'create') output = await create();
    else if (mode === 'inspect') output = await inspect(input);
    else if (mode === 'cleanup') output = await cleanup(input);
    else throw new Error(`Mode không hợp lệ: ${mode} (create | inspect | cleanup)`);

    process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (err) {
    process.stdout.write(`${JSON.stringify({ error: err.message })}\n`);
    exitCode = 1;
  } finally {
    await db.sequelize.close();
    process.exitCode = exitCode;
  }
})();
