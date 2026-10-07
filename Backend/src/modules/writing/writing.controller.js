const writingService = require('./writing.service');
const { successResponse } = require('../../common/utils/response');

async function getPrompts(req, res, next) {
  try {
    const { type } = req.query;
    const data = await writingService.getPrompts({ type });
    return successResponse(res, { message: 'Lấy danh sách đề bài viết thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function createSubmission(req, res, next) {
  try {
    const { prompt_id, content } = req.body;
    const data = await writingService.createSubmission(req.user.id, { prompt_id, content });
    return successResponse(res, { message: 'Chấm bài viết thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function getSubmissionDetail(req, res, next) {
  try {
    const data = await writingService.getSubmissionDetail(req.user.id, req.params.id);
    return successResponse(res, { message: 'Lấy chi tiết bài nộp thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getSubmissions(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const data = await writingService.getSubmissions(req.user.id, { limit, offset });
    return successResponse(res, { message: 'Lấy lịch sử bài nộp thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPrompts,
  createSubmission,
  getSubmissionDetail,
  getSubmissions
};
