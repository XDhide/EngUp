const express = require('express');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const AppError = require('../../common/utils/AppError');
const { successResponse } = require('../../common/utils/response');
const service = require('./results.service');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return next(new AppError('Chỉ admin mới có quyền truy cập', 403));
  next();
}

const posInt = (v) => {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new AppError('Tham số id không hợp lệ', 400);
  return n;
};

// Bọc handler: bắt lỗi + trả response chuẩn.
const handle = (fn, message, statusCode = 200) => async (req, res, next) => {
  try {
    return successResponse(res, { message, data: await fn(req), statusCode });
  } catch (err) {
    next(err);
  }
};

const paging = (req) => ({ limit: req.query.limit, offset: req.query.offset });

// ---- Học viên: /api/results/... ----
const userRouter = express.Router();
userRouter.get('/reading', authenticateJWT, handle((req) => service.myReading(req.user.id, paging(req)), 'Lấy lịch sử bài đọc thành công'));
userRouter.get('/listening', authenticateJWT, handle((req) => service.myListening(req.user.id, paging(req)), 'Lấy lịch sử bài nghe thành công'));

// ---- Admin: /api/admin/results/... và /api/admin/writing/prompts ----
// Mỗi route tự gắn authenticateJWT + requireAdmin (KHÔNG dùng router.use) vì router được mount ở /admin
// và không được chặn các router /admin/* khác (vd /admin/auth/login).
const adminRouter = express.Router();
const guard = [authenticateJWT, requireAdmin];

adminRouter.get('/results/tests', guard, handle((req) => service.adminTests({ test_set_id: posInt(req.query.test_set_id), ...paging(req) }), 'Lấy kết quả đề thi thành công'));
adminRouter.get('/results/reading', guard, handle((req) => service.adminReading({ article_id: posInt(req.query.article_id), ...paging(req) }), 'Lấy kết quả bài đọc thành công'));
adminRouter.get('/results/listening', guard, handle((req) => service.adminListening({ lesson_id: posInt(req.query.lesson_id), ...paging(req) }), 'Lấy kết quả bài nghe thành công'));
adminRouter.get('/results/writing', guard, handle((req) => service.adminWriting({ prompt_id: posInt(req.query.prompt_id), ...paging(req) }), 'Lấy kết quả bài viết thành công'));

adminRouter.get('/writing/prompts', guard, handle(() => service.listPrompts(), 'Lấy danh sách đề bài viết thành công'));
adminRouter.post('/writing/prompts', guard, handle((req) => service.createPrompt(req.body), 'Tạo đề bài viết thành công', 201));
adminRouter.put('/writing/prompts/:id', guard, handle((req) => service.updatePrompt(posInt(req.params.id), req.body), 'Cập nhật đề bài viết thành công'));
adminRouter.delete('/writing/prompts/:id', guard, handle((req) => service.deletePrompt(posInt(req.params.id)), 'Xoá đề bài viết thành công'));

module.exports = { userRouter, adminRouter };
