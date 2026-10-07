const AppError = require('../../common/utils/AppError');

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_OPTIONS = 6;

function stripLetterPrefix(text) {
  return String(text).replace(/^\s*[A-Fa-f][.)]\s*/, '').trim();
}

function normalizeReadingQuestion(input, label = 'Câu hỏi') {
  const body = input || {};
  const text = typeof body.question_text === 'string' ? body.question_text.trim() : '';
  if (!text) throw new AppError(`${label}: question_text là bắt buộc`, 400);
  if (text.length > 2000) throw new AppError(`${label}: question_text tối đa 2000 ký tự`, 400);

  if (!Array.isArray(body.options)) throw new AppError(`${label}: options phải là mảng`, 400);
  const cleaned = body.options.map((o) => stripLetterPrefix(o ?? '')).filter(Boolean);
  if (cleaned.length < 2) throw new AppError(`${label}: cần ít nhất 2 đáp án`, 400);
  if (cleaned.length > MAX_OPTIONS) throw new AppError(`${label}: tối đa ${MAX_OPTIONS} đáp án`, 400);
  if (new Set(cleaned.map((o) => o.toLowerCase())).size !== cleaned.length) {
    throw new AppError(`${label}: các đáp án không được trùng nhau`, 400);
  }
  const options = cleaned.map((o, i) => `${LETTERS[i]}. ${o}`);

  const rawAnswer = String(body.correct_answer ?? '').trim();
  if (!rawAnswer) throw new AppError(`${label}: correct_answer là bắt buộc`, 400);
  let correct = rawAnswer.toUpperCase();
  if (!(correct.length === 1 && LETTERS.indexOf(correct) >= 0 && LETTERS.indexOf(correct) < options.length)) {
    const idx = cleaned.findIndex((o) => o.toLowerCase() === stripLetterPrefix(rawAnswer).toLowerCase());
    if (idx < 0) throw new AppError(`${label}: correct_answer phải là một trong ${LETTERS.slice(0, options.length).join(', ')}`, 400);
    correct = LETTERS[idx];
  }

  const explanation = body.explanation === undefined || body.explanation === null ? null : String(body.explanation).trim() || null;
  if (explanation && explanation.length > 2000) throw new AppError(`${label}: explanation tối đa 2000 ký tự`, 400);

  return { question_text: text, options, correct_answer: correct, explanation };
}

module.exports = { normalizeReadingQuestion, stripLetterPrefix, LETTERS, MAX_OPTIONS };
