const service = require('./admin-placement.service');
const { successResponse } = require('../../common/utils/response');

const wrap = (fn, message, statusCode = 200) => async (req, res, next) => {
  try {
    return successResponse(res, { message, data: await fn(req), statusCode });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list: wrap((req) => service.listQuestions(req.user), 'Lấy câu hỏi test đầu vào thành công'),
  create: wrap((req) => service.createQuestion(req.user, req.body), 'Tạo câu hỏi test đầu vào thành công', 201),
  update: wrap((req) => service.updateQuestion(req.user, req.params.id, req.body), 'Cập nhật câu hỏi thành công'),
  remove: wrap((req) => service.deleteQuestion(req.user, req.params.id), 'Xoá câu hỏi thành công'),
  stats: wrap((req) => service.getStats(req.user), 'Lấy thống kê test đầu vào thành công')
};
