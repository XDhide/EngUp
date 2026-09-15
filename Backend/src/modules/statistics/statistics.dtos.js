// src/modules/statistics/statistics.dtos.js

function toOverviewDto({
  totalWordsLearned,
  totalReviews,
  currentStreak,
  longestStreak,
  readingAvgScore,
  listeningAvgAccuracy
}) {
  return {
    total_words_learned: totalWordsLearned,
    total_reviews: totalReviews,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    reading_avg_score: readingAvgScore,
    listening_avg_accuracy: listeningAvgAccuracy
  };
}

function toProgressDto(timeline) {
  return { timeline };
}

module.exports = {
  toOverviewDto,
  toProgressDto
};
