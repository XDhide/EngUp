const service = require('./notes.service');
const { successResponse } = require('../../common/utils/response');

const wrap = (fn, message, statusCode = 200) => async (req, res, next) => {
  try {
    return successResponse(res, { message, data: await fn(req), statusCode });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list: wrap((req) => service.listNotes(req.user.id, req.query), 'Lấy danh sách ghi chú thành công'),
  create: wrap((req) => service.createNote(req.user.id, req.body), 'Tạo ghi chú thành công', 201),
  update: wrap((req) => service.updateNote(req.user.id, req.params.id, req.body), 'Cập nhật ghi chú thành công'),
  remove: wrap((req) => service.deleteNote(req.user.id, req.params.id), 'Xoá ghi chú thành công')
};
