// src/modules/statistics/statistics.service.js
const statisticsRepository = require('./statistics.repository');
const { toOverviewDto, toProgressDto } = require('./statistics.dtos');

// DB hiện không lưu "thời lượng học" trực tiếp cho reading/listening, nên minutes_studied
// là số liệu ƯỚC LƯỢNG dựa trên tốc độ đọc/nghe trung bình và độ dài nội dung liên quan.
const READING_WORDS_PER_MINUTE = 200; // tốc độ đọc hiểu trung bình
const LISTENING_WORDS_PER_MINUTE = 130; // nghe + gõ lại chính tả chậm hơn đọc thông thường
const FALLBACK_SECONDS_PER_REVIEW = 8; // dùng khi response_time_ms không được client gửi lên (field optional)

const RANGE_TO_DAYS = { '7d': 7, '30d': 30 };
const MAX_ALL_RANGE_DAYS = 365; // giới hạn an toàn cho range=all để tránh timeline quá lớn

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToDateString(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateOnlyString(d);
}

async function getOverview(userId) {
  const [
    { current_streak, longest_streak },
    totalReviews,
    totalWordsLearned,
    readingAvgScore,
    listeningAvgAccuracy
  ] = await Promise.all([
    statisticsRepository.getStreakStats(userId),
    statisticsRepository.countTotalReviews(userId),
    statisticsRepository.countWordsLearned(userId),
    statisticsRepository.getReadingAvgScore(userId),
    statisticsRepository.getListeningAvgAccuracy(userId)
  ]);

  return toOverviewDto({
    totalWordsLearned,
    totalReviews,
    currentStreak: current_streak,
    longestStreak: longest_streak,
    readingAvgScore,
    listeningAvgAccuracy
  });
}

async function resolveDateRange(userId, range) {
  const todayStr = toDateOnlyString(new Date());

  if (range === 'all') {
    const earliest = await statisticsRepository.findEarliestActivityDate(userId);
    const cappedStartStr = addDaysToDateString(todayStr, -(MAX_ALL_RANGE_DAYS - 1));

    if (!earliest) {
      return { startDateStr: todayStr, endDateStr: todayStr };
    }

    const earliestStr = toDateOnlyString(earliest);
    const startDateStr = earliestStr > cappedStartStr ? earliestStr : cappedStartStr;
    return { startDateStr, endDateStr: todayStr };
  }

  const days = RANGE_TO_DAYS[range] || RANGE_TO_DAYS['7d'];
  return { startDateStr: addDaysToDateString(todayStr, -(days - 1)), endDateStr: todayStr };
}

async function getProgress(userId, range) {
  const { startDateStr, endDateStr } = await resolveDateRange(userId, range);

  const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
  const endDate = new Date(`${endDateStr}T23:59:59.999Z`);

  const [reviewLogs, readingAttempts, listeningAttempts] = await Promise.all([
    statisticsRepository.findReviewLogsBetween(userId, startDate, endDate),
    statisticsRepository.findReadingAttemptsBetween(userId, startDate, endDate),
    statisticsRepository.findListeningAttemptsBetween(userId, startDate, endDate)
  ]);

  // Khởi tạo sẵn từng ngày trong khoảng để ngày không có hoạt động vẫn xuất hiện với giá trị 0
  const buckets = new Map();
  for (let cursor = startDateStr; cursor <= endDateStr; cursor = addDaysToDateString(cursor, 1)) {
    buckets.set(cursor, { words_reviewed: 0, study_seconds: 0 });
  }

  reviewLogs.forEach((log) => {
    const dateStr = toDateOnlyString(new Date(log.reviewed_at));
    const bucket = buckets.get(dateStr);
    if (!bucket) return;

    bucket.words_reviewed += 1;
    const seconds = log.response_time_ms ? log.response_time_ms / 1000 : FALLBACK_SECONDS_PER_REVIEW;
    bucket.study_seconds += seconds;
  });

  readingAttempts.forEach((attempt) => {
    const dateStr = toDateOnlyString(new Date(attempt.submitted_at));
    const bucket = buckets.get(dateStr);
    if (!bucket) return;

    const wordCount = countWords(attempt.article?.content);
    bucket.study_seconds += (wordCount / READING_WORDS_PER_MINUTE) * 60;
  });

  listeningAttempts.forEach((attempt) => {
    const dateStr = toDateOnlyString(new Date(attempt.submitted_at));
    const bucket = buckets.get(dateStr);
    if (!bucket) return;

    const wordCount = countWords(attempt.lesson?.transcript);
    bucket.study_seconds += (wordCount / LISTENING_WORDS_PER_MINUTE) * 60;
  });

  const timeline = Array.from(buckets.entries()).map(([date, bucket]) => ({
    date,
    words_reviewed: bucket.words_reviewed,
    minutes_studied: Number((bucket.study_seconds / 60).toFixed(1))
  }));

  return toProgressDto(timeline);
}

module.exports = {
  getOverview,
  getProgress
};
