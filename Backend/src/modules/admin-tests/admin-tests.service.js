const adminTestsRepository = require('./admin-tests.Repository');
const AppError = require('../../common/utils/AppError');
const { toTestSetDto, toQuestionDto, toAttemptStatDto } = require('./admin-tests.dtos');

const TEST_SET_FIELDS = ['exam_type', 'section', 'title', 'time_limit_minutes'];
const QUESTION_FIELDS = [
  'test_set_id',
  'question_text',
  'question_type',
  'options',
  'correct_answer',
  'audio_url',
  'passage_text',
  'order_index'
];

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  }
}

// Chỉ lấy các field được phép (chống mass-assignment: không cho client ghi id, is_approved...).
function pick(source, fields) {
  const result = {};
  fields.forEach((field) => {
    if (source && source[field] !== undefined) result[field] = source[field];
  });
  return result;
}

// Các field có giá trị thực sự thay đổi so với bản ghi hiện tại -> ghi vào audit log.
function diffFields(current, patch) {
  const changes = {};
  Object.keys(patch).forEach((field) => {
    if (JSON.stringify(current[field]) !== JSON.stringify(patch[field])) {
      changes[field] = { from: current[field] ?? null, to: patch[field] };
    }
  });
  return changes;
}

// Ràng buộc chéo giữa các field của câu hỏi (kiểm tra trên bản ghi SAU khi gộp với dữ liệu cũ).
// Khớp với cách test-practice chấm điểm: multiple_choice / fill_blank so correct_answer.
function assertQuestionConsistent({ question_type, options, correct_answer }) {
  if (question_type === 'multiple_choice') {
    if (!Array.isArray(options) || options.length < 2) {
      throw new AppError('Câu hỏi multiple_choice cần options là mảng có ít nhất 2 lựa chọn', 400);
    }
  }
  if (['multiple_choice', 'fill_blank'].includes(question_type) && !correct_answer) {
    throw new AppError(`Câu hỏi ${question_type} bắt buộc phải có correct_answer`, 400);
  }
}

async function getTestSetOrThrow(id, transaction) {
  const testSet = await adminTestsRepository.findTestSetById(id, transaction);
  if (!testSet) throw new AppError('Đề thi không tồn tại', 404);
  return testSet;
}

async function getQuestionOrThrow(id, transaction) {
  const question = await adminTestsRepository.findQuestionById(id, transaction);
  if (!question) throw new AppError('Câu hỏi không tồn tại', 404);
  return question;
}

// ---------- CRUD đề thi ----------

async function createTestSet(requester, payload) {
  assertAdmin(requester);
  const data = pick(payload, TEST_SET_FIELDS);

  return adminTestsRepository.withTransaction(async (transaction) => {
    const testSet = await adminTestsRepository.createTestSet(data, transaction);

    await adminTestsRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'test_set.create',
        target_type: 'test_set',
        target_id: testSet.id,
        detail: data
      },
      transaction
    );

    return toTestSetDto(testSet);
  });
}

async function updateTestSet(requester, testSetId, payload) {
  assertAdmin(requester);
  const patch = pick(payload, TEST_SET_FIELDS);

  return adminTestsRepository.withTransaction(async (transaction) => {
    const testSet = await getTestSetOrThrow(testSetId, transaction);
    const changes = diffFields(testSet, patch);

    const updated = await adminTestsRepository.updateTestSet(testSet, patch, transaction);

    await adminTestsRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'test_set.update',
        target_type: 'test_set',
        target_id: testSet.id,
        detail: { changes }
      },
      transaction
    );

    return toTestSetDto(updated);
  });
}

async function deleteTestSet(requester, testSetId) {
  assertAdmin(requester);

  return adminTestsRepository.withTransaction(async (transaction) => {
    const testSet = await getTestSetOrThrow(testSetId, transaction);

    // Xoá đề sẽ kéo theo xoá (CASCADE) toàn bộ lượt làm bài của học viên -> không cho phép.
    const attemptCount = await adminTestsRepository.countAttemptsOfTestSet(testSet.id, transaction);
    if (attemptCount > 0) {
      throw new AppError(
        `Đề thi đã có ${attemptCount} lượt làm bài của học viên nên không thể xoá`,
        409
      );
    }

    const questionCount = await adminTestsRepository.countQuestionsOfTestSet(testSet.id, transaction);
    const snapshot = toTestSetDto(testSet); // chụp lại trước khi xoá để trả về

    await adminTestsRepository.destroyTestSet(testSet, transaction);

    await adminTestsRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'test_set.delete',
        target_type: 'test_set',
        target_id: snapshot.id,
        detail: { title: snapshot.title, exam_type: snapshot.exam_type, deleted_questions: questionCount }
      },
      transaction
    );

    return snapshot;
  });
}

// ---------- CRUD câu hỏi ----------

async function createQuestion(requester, payload) {
  assertAdmin(requester);
  const data = pick(payload, QUESTION_FIELDS);
  if (data.order_index === undefined) data.order_index = 0;

  return adminTestsRepository.withTransaction(async (transaction) => {
    await getTestSetOrThrow(data.test_set_id, transaction);
    assertQuestionConsistent(data);

    const question = await adminTestsRepository.createQuestion(data, transaction);

    await adminTestsRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'test_question.create',
        target_type: 'test_question',
        target_id: question.id,
        detail: { test_set_id: question.test_set_id, question_type: question.question_type }
      },
      transaction
    );

    return toQuestionDto(question);
  });
}

async function updateQuestion(requester, questionId, payload) {
  assertAdmin(requester);
  const patch = pick(payload, QUESTION_FIELDS);

  return adminTestsRepository.withTransaction(async (transaction) => {
    const question = await getQuestionOrThrow(questionId, transaction);

    if (patch.test_set_id !== undefined && patch.test_set_id !== question.test_set_id) {
      await getTestSetOrThrow(patch.test_set_id, transaction);
    }

    // PUT là cập nhật từng phần: kiểm tra ràng buộc trên bản ghi đã gộp.
    assertQuestionConsistent({ ...toQuestionDto(question), ...patch });

    const changes = diffFields(question, patch);
    const updated = await adminTestsRepository.updateQuestion(question, patch, transaction);

    await adminTestsRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'test_question.update',
        target_type: 'test_question',
        target_id: question.id,
        detail: { changed_fields: Object.keys(changes) }
      },
      transaction
    );

    return toQuestionDto(updated);
  });
}

async function deleteQuestion(requester, questionId) {
  assertAdmin(requester);

  return adminTestsRepository.withTransaction(async (transaction) => {
    const question = await getQuestionOrThrow(questionId, transaction);
    const snapshot = toQuestionDto(question);

    await adminTestsRepository.destroyQuestion(question, transaction);

    await adminTestsRepository.createAuditLog(
      {
        actor_id: requester.id,
        action: 'test_question.delete',
        target_type: 'test_question',
        target_id: snapshot.id,
        detail: { test_set_id: snapshot.test_set_id }
      },
      transaction
    );

    return snapshot;
  });
}

// ---------- Thống kê theo đề thi ----------

async function getAttemptStats(requester, testSetId) {
  assertAdmin(requester);
  await getTestSetOrThrow(testSetId);

  const attempts = await adminTestsRepository.findAttemptsOfTestSet(testSetId);
  const submitted = attempts.filter((a) => a.status === 'submitted').length;

  // completion_rate: % lượt làm đã nộp bài (0..100, làm tròn 2 chữ số); chưa có lượt nào -> 0.
  const completionRate = attempts.length > 0 ? Number(((submitted / attempts.length) * 100).toFixed(2)) : 0;

  return {
    attempts: attempts.map(toAttemptStatDto),
    completion_rate: completionRate
  };
}

module.exports = {
  createTestSet,
  updateTestSet,
  deleteTestSet,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAttemptStats
};
