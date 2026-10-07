const service = require('./contributions.service');
const { successResponse } = require('../../common/utils/response');

const wrap = (fn, message, statusCode = 200) => async (req, res, next) => {
  try {
    const data = await fn(req);
    return successResponse(res, { message, data, statusCode });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitReading: wrap((req) => service.submitReading(req.user, req.body), 'Đã gửi bài đọc, đang chờ quản trị viên duyệt', 201),
  submitVocabulary: wrap((req) => service.submitVocabulary(req.user, req.body), 'Đã gửi từ vựng, đang chờ quản trị viên duyệt', 201),
  submitTestQuestion: wrap((req) => service.submitTestQuestion(req.user, req.body), 'Đã gửi câu hỏi, đang chờ quản trị viên duyệt', 201),
  listMine: wrap((req) => service.listMine(req.user), 'Lấy danh sách đóng góp thành công'),
  withdraw: wrap((req) => service.withdraw(req.user, req.params.id), 'Đã rút lại đóng góp')
};
