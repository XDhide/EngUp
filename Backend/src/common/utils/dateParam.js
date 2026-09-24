/**
 * Phân tích tham số ngày trong query string (dùng chung cho các module admin).
 */
// YYYY-MM-DD hoặc ISO 8601 (giờ không kèm múi giờ được hiểu là UTC).
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/;

function isValidCalendarDate(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Trả về Date hợp lệ hoặc null.
 * - 'YYYY-MM-DD'  : `from` -> 00:00:00.000 UTC, `to` -> 23:59:59.999 UTC (bao trọn ngày đó)
 * - ISO 8601 đầy đủ: dùng đúng thời điểm được truyền
 */
function parseDateParam(value, boundary) {
  if (typeof value !== 'string') return null;

  const dateOnly = DATE_ONLY.exec(value);
  if (dateOnly) {
    const [y, m, d] = dateOnly.slice(1).map(Number);
    if (!isValidCalendarDate(y, m, d)) return null;
    return boundary === 'to' ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)) : new Date(Date.UTC(y, m - 1, d));
  }

  const dateTime = DATE_TIME.exec(value);
  if (dateTime) {
    const [y, m, d] = dateTime.slice(1, 4).map(Number);
    if (!isValidCalendarDate(y, m, d)) return null;

    const hasZone = Boolean(dateTime[8]);
    const parsed = new Date(hasZone ? value : `${value}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

module.exports = { parseDateParam };
