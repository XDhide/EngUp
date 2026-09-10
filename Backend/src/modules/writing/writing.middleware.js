const writingRepository = require('./writing.repository');
const AppError = require('../../common/utils/AppError');

// Số lượt chấm AI tối đa mỗi ngày cho 1 user, cấu hình qua biến môi trường, mặc định 5 lượt/ngày.
const DAILY_AI_GRADING_LIMIT = Number(process.env.WRITING_AI_DAILY_LIMIT) || 5;

async function checkWritingQuota(req, res, next) {
  try {
    const usedToday = await writingRepository.countTodaySubmissions(req.user.id);

    if (usedToday >= DAILY_AI_GRADING_LIMIT) {
      throw new AppError('Đã hết lượt chấm AI hôm nay', 429);
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkWritingQuota;
