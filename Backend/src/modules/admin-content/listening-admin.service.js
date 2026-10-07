const listeningAdminRepository = require('./listening-admin.Repository');
const AppError = require('../../common/utils/AppError');

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  }
}

function toLessonAdminDto(lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    audio_url: lesson.audio_url,
    transcript: lesson.transcript,
    difficulty: lesson.difficulty,
    topic: lesson.topic
  };
}

async function createLesson(requester, { title, transcript, difficulty, topic }) {
  assertAdmin(requester);
  // audio_url NOT NULL ở schema nhưng chưa có file audio ngay lúc tạo (upload là API
  // riêng sau) -> tạm để chuỗi rỗng, bắt buộc gọi /audio ngay sau khi tạo lesson.
  const lesson = await listeningAdminRepository.createLesson({
    title,
    transcript,
    difficulty,
    topic,
    audio_url: ''
  });
  return toLessonAdminDto(lesson);
}

async function updateLesson(requester, lessonId, fieldsToUpdate) {
  assertAdmin(requester);
  const lesson = await listeningAdminRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Bài nghe không tồn tại', 404);
  }
  const updated = await listeningAdminRepository.updateLesson(lesson, fieldsToUpdate);
  return toLessonAdminDto(updated);
}

async function deleteLesson(requester, lessonId) {
  assertAdmin(requester);
  const lesson = await listeningAdminRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Bài nghe không tồn tại', 404);
  }
  await listeningAdminRepository.deleteLesson(lesson);
  return null;
}

async function updateLessonAudio(requester, lessonId, audioUrl) {
  assertAdmin(requester);
  const lesson = await listeningAdminRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Bài nghe không tồn tại', 404);
  }
  await listeningAdminRepository.updateLesson(lesson, { audio_url: audioUrl });
  return { audio_url: audioUrl };
}

module.exports = {
  createLesson,
  updateLesson,
  deleteLesson,
  updateLessonAudio
};
