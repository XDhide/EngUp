const listeningAdminService = require('./listening-admin.service');
const { successResponse } = require('../../common/utils/response');

async function createLesson(req, res, next) {
  try {
    const { title, transcript, difficulty, topic } = req.body;
    const data = await listeningAdminService.createLesson(req.user, { title, transcript, difficulty, topic });
    return successResponse(res, { message: 'Tạo bài nghe thành công', data, statusCode: 201 });
  } catch (err) {
    next(err);
  }
}

async function updateLesson(req, res, next) {
  try {
    const data = await listeningAdminService.updateLesson(req.user, req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật bài nghe thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function deleteLesson(req, res, next) {
  try {
    const data = await listeningAdminService.deleteLesson(req.user, req.params.id);
    return successResponse(res, { message: 'Xoá bài nghe thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function uploadAudio(req, res, next) {
  try {
    if (!req.file) {
      return next(new (require('../../common/utils/AppError'))('Thiếu file audio', 400));
    }
    // Đường dẫn tương đối — cần server.js đã có express.static('/uploads', ...)
    // để file thực sự truy cập được qua URL này.
    const audioUrl = `/uploads/audio/${req.file.filename}`;
    const data = await listeningAdminService.updateLessonAudio(req.user, req.params.id, audioUrl);
    return successResponse(res, { message: 'Gán audio cho bài nghe thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = { createLesson, updateLesson, deleteLesson, uploadAudio };
