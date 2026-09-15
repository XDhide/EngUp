const statisticsService = require('./statistics.service');
const { successResponse } = require('../../common/utils/response');

async function getOverview(req, res, next) {
  try {
    const data = await statisticsService.getOverview(req.user.id);
    return successResponse(res, { message: 'Lấy thống kê tổng quan thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getProgress(req, res, next) {
  try {
    const { range } = req.query;
    const data = await statisticsService.getProgress(req.user.id, range || '7d');
    return successResponse(res, { message: 'Lấy tiến độ học tập thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getProgress
};
