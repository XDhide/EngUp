const AppError = require('../../common/utils/AppError');

const VALID_RANGES = ['7d', '30d', 'all'];

function validateProgressQuery(req, res, next) {
  const { range } = req.query || {};

  if (range !== undefined && !VALID_RANGES.includes(range)) {
    return next(new AppError(`range phải là một trong: ${VALID_RANGES.join(', ')}`, 400));
  }

  next();
}

module.exports = {
  validateProgressQuery
};
