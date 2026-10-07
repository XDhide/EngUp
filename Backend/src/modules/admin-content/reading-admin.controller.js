const readingService = require('../reading/reading.service');
const { successResponse } = require('../../common/utils/response');

async function createArticle(req, res, next) {
  try {
    const { title, content, difficulty, topic, questions } = req.body;
    const data = await readingService.createArticleManual(req.user, { title, content, difficulty, topic, questions });
    return successResponse(res, { message: 'Tạo bài đọc thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function updateArticle(req, res, next) {
  try {
    const data = await readingService.updateArticleManual(req.user, req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật bài đọc thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function deleteArticle(req, res, next) {
  try {
    const data = await readingService.deleteArticleManual(req.user, req.params.id);
    return successResponse(res, { message: 'Xoá bài đọc thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getArticle(req, res, next) {
  try {
    const data = await readingService.getArticleAdminDetail(req.user, req.params.id);
    return successResponse(res, { message: 'Lấy bài đọc thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function addQuestion(req, res, next) {
  try {
    const data = await readingService.addQuestionManual(req.user, req.params.id, req.body);
    return successResponse(res, { message: 'Thêm câu hỏi thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const data = await readingService.updateQuestionManual(req.user, req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật câu hỏi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const data = await readingService.deleteQuestionManual(req.user, req.params.id);
    return successResponse(res, { message: 'Xoá câu hỏi thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = { createArticle, updateArticle, deleteArticle, getArticle, addQuestion, updateQuestion, deleteQuestion };
