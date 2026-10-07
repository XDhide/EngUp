const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Ho_Chi_Minh';

function partsInTz(date, timeZone = APP_TIMEZONE) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const out = {};
  for (const p of fmt.formatToParts(date)) if (p.type !== 'literal') out[p.type] = p.value;
  return out;
}

function localDateString(date = new Date(), timeZone = APP_TIMEZONE) {
  const p = partsInTz(date, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function localTimeString(date = new Date(), timeZone = APP_TIMEZONE) {
  const p = partsInTz(date, timeZone);
  return `${p.hour}:${p.minute}`;
}

function addDaysToDateString(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function tzOffsetMinutes(date, timeZone = APP_TIMEZONE) {
  const p = partsInTz(date, timeZone);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

function localDayRangeUtc(dateStr, timeZone = APP_TIMEZONE) {
  const guess = new Date(`${dateStr}T00:00:00.000Z`);
  const start = new Date(guess.getTime() - tzOffsetMinutes(guess, timeZone) * 60000);
  const nextStr = addDaysToDateString(dateStr, 1);
  const nextGuess = new Date(`${nextStr}T00:00:00.000Z`);
  const end = new Date(nextGuess.getTime() - tzOffsetMinutes(nextGuess, timeZone) * 60000);
  return { start, end };
}

module.exports = {
  APP_TIMEZONE,
  localDateString,
  localTimeString,
  addDaysToDateString,
  tzOffsetMinutes,
  localDayRangeUtc
};
