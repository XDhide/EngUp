const testService = require('./test.service');
const { successResponse } = require('../../common/utils/response');

async function getTestSets(req, res, next) {
  try {
    const { exam_type, section } = req.query;
    const data = await testService.getTestSets({ exam_type, section });
    return successResponse(res, { message: 'Lấy danh sách đề thi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getQuestions(req, res, next) {
  try {
    const data = await testService.getQuestions(req.params.id);
    return successResponse(res, { message: 'Lấy danh sách câu hỏi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function startAttempt(req, res, next) {
  try {
    const data = await testService.startAttempt(req.user.id, req.params.id);
    return successResponse(res, { message: 'Bắt đầu làm bài thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function submitAttempt(req, res, next) {
  try {
    const { attempt_id, answers } = req.body;
    const data = await testService.submitAttempt(req.user.id, { attempt_id, answers });
    return successResponse(res, { message: 'Nộp bài thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function submitWriting(req, res, next) {
  try {
    const { attempt_id, content } = req.body;
    const data = await testService.submitWriting(req.user.id, req.params.id, { attempt_id, content });
    return successResponse(res, { message: 'Chấm bài Writing/Speaking thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getAttemptResult(req, res, next) {
  try {
    const data = await testService.getAttemptResult(req.user.id, req.params.id);
    return successResponse(res, { message: 'Lấy kết quả bài thi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getAttempts(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const data = await testService.getAttempts(req.user.id, { limit, offset });
    return successResponse(res, { message: 'Lấy lịch sử thi thử thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTestSets,
  getQuestions,
  startAttempt,
  submitAttempt,
  submitWriting,
  getAttemptResult,
  getAttempts
};
