const { ListeningLesson, ListeningDictationAttempt } = require('../../common/models');

async function findLessons({ difficulty, topic } = {}) {
  const where = {};
  if (difficulty) where.difficulty = difficulty;
  if (topic) where.topic = topic;

  return ListeningLesson.findAll({
    where,
    order: [['id', 'ASC']]
  });
}

async function findLessonById(id) {
  return ListeningLesson.findByPk(id);
}

async function createDictationAttempt({ user_id, lesson_id, user_text, accuracy_percent, wrong_words }) {
  return ListeningDictationAttempt.create({
    user_id,
    lesson_id,
    user_text,
    accuracy_percent,
    wrong_words
  });
}

module.exports = {
  findLessons,
  findLessonById,
  createDictationAttempt
};
