const listeningRepository = require('./listening.repository');
const AppError = require('../../common/utils/AppError');
const {
  toLessonListItemDto,
  toLessonDetailDto,
  toDictationResultDto
} = require('./listening.dtos');

function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"'“”‘’()\-]/g, '')
    .trim();
}

function tokenize(text) {
  return (text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// So sánh user_text với transcript gốc theo từng từ (vị trí tương ứng).
// Trả về % chính xác và danh sách các từ trong transcript mà người dùng gõ sai/thiếu.
function compareWithTranscript(transcript, userText) {
  const transcriptWords = tokenize(transcript);
  const userWords = tokenize(userText);

  const totalWords = transcriptWords.length;
  if (totalWords === 0) {
    return { accuracy_percent: 0, wrong_words: [] };
  }

  const wrongWords = [];

  for (let i = 0; i < totalWords; i += 1) {
    const expected = transcriptWords[i];
    const actual = userWords[i];

    if (actual === undefined || normalizeWord(actual) !== normalizeWord(expected)) {
      wrongWords.push(expected);
    }
  }

  const correctCount = totalWords - wrongWords.length;
  const accuracyPercent = Number(((correctCount / totalWords) * 100).toFixed(2));

  return { accuracy_percent: accuracyPercent, wrong_words: wrongWords };
}

async function getLessons({ difficulty, topic }) {
  const lessons = await listeningRepository.findLessons({ difficulty, topic });
  return { lessons: lessons.map(toLessonListItemDto) };
}

async function getLessonDetail(lessonId) {
  const lesson = await listeningRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Bài nghe không tồn tại', 404);
  }
  return toLessonDetailDto(lesson);
}

async function submitDictation(userId, lessonId, userText) {
  const lesson = await listeningRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Bài nghe không tồn tại', 404);
  }

  const { accuracy_percent, wrong_words } = compareWithTranscript(lesson.transcript, userText);

  await listeningRepository.createDictationAttempt({
    user_id: userId,
    lesson_id: lesson.id,
    user_text: userText,
    accuracy_percent,
    wrong_words
  });

  return toDictationResultDto({ accuracy_percent, wrong_words });
}

module.exports = {
  getLessons,
  getLessonDetail,
  submitDictation
};
