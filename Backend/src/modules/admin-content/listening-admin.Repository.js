const { ListeningLesson } = require('../../common/models');

// File này KHÔNG phải bản sửa của listening.repository.js (đồng đội) — Admin Content
// tự truy cập bảng listening_lessons riêng cho mục đích quản trị (thêm/sửa/xoá/gán audio),
// độc lập với module Listening (module Listening chỉ lo phần học viên xem bài + làm dictation).

async function findLessonById(id) {
  return ListeningLesson.findByPk(id);
}

async function createLesson(data) {
  return ListeningLesson.create(data);
}

async function updateLesson(lesson, fieldsToUpdate) {
  await lesson.update(fieldsToUpdate);
  return lesson;
}

async function deleteLesson(lesson) {
  // FK listening_dictation_attempts -> listening_lessons là ON DELETE CASCADE.
  return lesson.destroy();
}

module.exports = {
  findLessonById,
  createLesson,
  updateLesson,
  deleteLesson
};
