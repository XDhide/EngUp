const adminTestsService = require('./admin-tests.service');
const { successResponse } = require('../../common/utils/response');

async function createTestSet(req, res, next) {
  try {
    const data = await adminTestsService.createTestSet(req.user, req.body);
    return successResponse(res, { message: 'Tạo đề thi thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function updateTestSet(req, res, next) {
  try {
    const data = await adminTestsService.updateTestSet(req.user, req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật đề thi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function deleteTestSet(req, res, next) {
  try {
    const data = await adminTestsService.deleteTestSet(req.user, req.params.id);
    return successResponse(res, { message: 'Xoá đề thi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function createQuestion(req, res, next) {
  try {
    const data = await adminTestsService.createQuestion(req.user, req.body);
    return successResponse(res, { message: 'Tạo câu hỏi thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const data = await adminTestsService.updateQuestion(req.user, req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật câu hỏi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const data = await adminTestsService.deleteQuestion(req.user, req.params.id);
    return successResponse(res, { message: 'Xoá câu hỏi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getAttemptStats(req, res, next) {
  try {
    const data = await adminTestsService.getAttemptStats(req.user, Number(req.query.test_set_id));
    return successResponse(res, { message: 'Lấy thống kê lượt làm bài thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
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
