const vocabularyService = require('./vocabulary.service');
const { successResponse } = require('../../common/utils/response');

async function getTopics(req, res, next) {
  try {
    const data = await vocabularyService.getTopics();
    return successResponse(res, { message: 'Lấy danh sách chủ đề thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getWords(req, res, next) {
  try {
    const { topic_id, difficulty, limit, offset } = req.query;
    const data = await vocabularyService.getWords({ topic_id, difficulty, limit, offset });
    return successResponse(res, { message: 'Lấy danh sách từ vựng thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function createWord(req, res, next) {
  try {
    const { topic_id, word, phonetic, meaning, example_sentence, audio_url, difficulty } = req.body;
    const data = await vocabularyService.createWord(req.user, {
      topic_id,
      word,
      phonetic,
      meaning,
      example_sentence,
      audio_url,
      difficulty
    });
    return successResponse(res, { message: 'Tạo từ vựng thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function updateWord(req, res, next) {
  try {
    const data = await vocabularyService.updateWord(req.user, req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật từ vựng thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function deleteWord(req, res, next) {
  try {
    const data = await vocabularyService.deleteWord(req.user, req.params.id);
    return successResponse(res, { message: 'Xoá từ vựng thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getNewWords(req, res, next) {
  try {
    const data = await vocabularyService.getNewWords(req.user.id, req.query.limit);
    return successResponse(res, { message: 'Lấy từ mới trong ngày thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function updateDailyNewWordLimit(req, res, next) {
  try {
    const data = await vocabularyService.updateDailyNewWordLimit(req.user.id, req.body.limit);
    return successResponse(res, { message: 'Cập nhật giới hạn từ mới/ngày thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getTodayReviewCards(req, res, next) {
  try {
    const data = await vocabularyService.getTodayReviewCards(req.user.id);
    return successResponse(res, { message: 'Lấy danh sách ôn tập hôm nay thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function submitReview(req, res, next) {
  try {
    const { card_id, result, response_time_ms } = req.body;
    const data = await vocabularyService.submitReview(req.user.id, { card_id, result, response_time_ms });
    return successResponse(res, { message: 'Ghi nhận kết quả ôn tập thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTopics,
  getWords,
  createWord,
  updateWord,
  deleteWord,
  getNewWords,
  updateDailyNewWordLimit,
  getTodayReviewCards,
  submitReview
};