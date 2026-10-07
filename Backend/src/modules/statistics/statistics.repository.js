const { Op, fn, col } = require('sequelize');
const {
  Streak,
  ReviewLog,
  UserVocabularyCard,
  ReadingAttempt,
  ReadingArticle,
  ListeningDictationAttempt,
  ListeningLesson
} = require('../../common/models');

async function getStreakStats(userId) {
  const streak = await Streak.findOne({
    where: { user_id: userId },
    attributes: ['current_streak', 'longest_streak']
  });

  return {
    current_streak: streak ? streak.current_streak : 0,
    longest_streak: streak ? streak.longest_streak : 0
  };
}

async function countTotalReviews(userId) {
  return ReviewLog.count({ where: { user_id: userId } });
}

async function countWordsLearned(userId) {
  return UserVocabularyCard.count({
    where: { user_id: userId, repetitions: { [Op.gt]: 0 } }
  });
}

async function getReadingAvgScore(userId) {
  const result = await ReadingAttempt.findOne({
    where: { user_id: userId },
    attributes: [[fn('AVG', col('score')), 'avg_score']],
    raw: true
  });

  if (!result || result.avg_score === null || result.avg_score === undefined) return null;
  return Number(Number(result.avg_score).toFixed(2));
}

async function getListeningAvgAccuracy(userId) {
  const result = await ListeningDictationAttempt.findOne({
    where: { user_id: userId },
    attributes: [[fn('AVG', col('accuracy_percent')), 'avg_accuracy']],
    raw: true
  });

  if (!result || result.avg_accuracy === null || result.avg_accuracy === undefined) return null;
  return Number(Number(result.avg_accuracy).toFixed(2));
}

async function findReviewLogsBetween(userId, startDate, endDate) {
  return ReviewLog.findAll({
    where: { user_id: userId, reviewed_at: { [Op.between]: [startDate, endDate] } },
    attributes: ['reviewed_at', 'response_time_ms'],
    raw: true
  });
}

async function findReadingAttemptsBetween(userId, startDate, endDate) {
  return ReadingAttempt.findAll({
    where: { user_id: userId, submitted_at: { [Op.between]: [startDate, endDate] } },
    attributes: ['submitted_at'],
    include: [{ model: ReadingArticle, as: 'article', attributes: ['content'] }]
  });
}

async function findListeningAttemptsBetween(userId, startDate, endDate) {
  return ListeningDictationAttempt.findAll({
    where: { user_id: userId, submitted_at: { [Op.between]: [startDate, endDate] } },
    attributes: ['submitted_at'],
    include: [{ model: ListeningLesson, as: 'lesson', attributes: ['transcript'] }]
  });
}

async function findEarliestActivityDate(userId) {
  const [firstReview, firstReading, firstListening] = await Promise.all([
    ReviewLog.findOne({
      where: { user_id: userId },
      order: [['reviewed_at', 'ASC']],
      attributes: ['reviewed_at'],
      raw: true
    }),
    ReadingAttempt.findOne({
      where: { user_id: userId },
      order: [['submitted_at', 'ASC']],
      attributes: ['submitted_at'],
      raw: true
    }),
    ListeningDictationAttempt.findOne({
      where: { user_id: userId },
      order: [['submitted_at', 'ASC']],
      attributes: ['submitted_at'],
      raw: true
    })
  ]);

  const dates = [firstReview?.reviewed_at, firstReading?.submitted_at, firstListening?.submitted_at].filter(
    Boolean
  );
  if (dates.length === 0) return null;

  return new Date(Math.min(...dates.map((d) => new Date(d).getTime())));
}

module.exports = {
  getStreakStats,
  countTotalReviews,
  countWordsLearned,
  getReadingAvgScore,
  getListeningAvgAccuracy,
  findReviewLogsBetween,
  findReadingAttemptsBetween,
  findListeningAttemptsBetween,
  findEarliestActivityDate
};
