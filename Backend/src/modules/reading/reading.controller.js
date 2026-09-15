const readingService = require('./reading.service');
const { successResponse } = require('../../common/utils/response');

async function getArticles(req, res, next) {
  try {
    const { difficulty, topic } = req.query;
    const data = await readingService.getArticles({ difficulty, topic });
    return successResponse(res, { message: 'Lấy danh sách bài đọc thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getArticleDetail(req, res, next) {
  try {
    const data = await readingService.getArticleDetail(req.params.id);
    return successResponse(res, { message: 'Lấy chi tiết bài đọc thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function submitArticle(req, res, next) {
  try {
    const { answers } = req.body;
    const data = await readingService.submitArticle(req.user.id, req.params.id, answers);
    return successResponse(res, { message: 'Chấm điểm bài đọc thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function generateArticle(req, res, next) {
  try {
    const { topic, difficulty } = req.body;
    const data = await readingService.generateArticle(req.user, { topic, difficulty });
    return successResponse(res, { message: 'Sinh bài đọc bằng AI thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getArticles,
  getArticleDetail,
  submitArticle,
  generateArticle
};
