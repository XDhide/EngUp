const listeningService = require('./listening.service');
const { successResponse } = require('../../common/utils/response');

async function getLessons(req, res, next) {
  try {
    const { difficulty, topic } = req.query;
    const data = await listeningService.getLessons({ difficulty, topic });
    return successResponse(res, { message: 'Lấy danh sách bài nghe thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getLessonDetail(req, res, next) {
  try {
    const data = await listeningService.getLessonDetail(req.params.id);
    return successResponse(res, { message: 'Lấy chi tiết bài nghe thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function submitDictation(req, res, next) {
  try {
    const { user_text } = req.body;
    const data = await listeningService.submitDictation(req.user.id, req.params.id, user_text);
    return successResponse(res, { message: 'Chấm điểm dictation thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLessons,
  getLessonDetail,
  submitDictation
};
