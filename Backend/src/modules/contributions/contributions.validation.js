const AppError = require('../../common/utils/AppError');

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

function fail(next, errors) {
  return next(new AppError(errors.join('; '), 400));
}

function validateReading(req, res, next) {
  const b = req.body || {};
  const errors = [];
  if (!isStr(b.title)) errors.push('title là bắt buộc');
  else if (b.title.trim().length > 255) errors.push('title tối đa 255 ký tự');
  if (!isStr(b.content)) errors.push('content là bắt buộc');
  else if (b.content.trim().length < 50) errors.push('Nội dung bài đọc cần ít nhất 50 ký tự');
  else if (b.content.length > 20000) errors.push('Nội dung bài đọc tối đa 20.000 ký tự');
  if (b.difficulty && !CEFR.includes(b.difficulty)) errors.push(`difficulty phải là một trong: ${CEFR.join(', ')}`);
  if (b.topic && String(b.topic).length > 150) errors.push('topic tối đa 150 ký tự');
  if (b.questions !== undefined && !Array.isArray(b.questions)) errors.push('questions phải là mảng');
  if (Array.isArray(b.questions) && b.questions.length > 20) errors.push('Tối đa 20 câu hỏi cho mỗi bài đọc');
  if (errors.length) return fail(next, errors);
  next();
}

function validateVocabulary(req, res, next) {
  const b = req.body || {};
  const errors = [];
  if (!isStr(b.word)) errors.push('word là bắt buộc');
  else if (b.word.trim().length > 150) errors.push('word tối đa 150 ký tự');
  if (!isStr(b.meaning)) errors.push('meaning là bắt buộc');
  else if (b.meaning.trim().length > 500) errors.push('meaning tối đa 500 ký tự');
  if (b.phonetic && String(b.phonetic).length > 150) errors.push('phonetic tối đa 150 ký tự');
  if (b.example_sentence && String(b.example_sentence).length > 1000) errors.push('example_sentence tối đa 1000 ký tự');
  if (b.difficulty && !CEFR.includes(b.difficulty)) errors.push(`difficulty phải là một trong: ${CEFR.join(', ')}`);
  if (b.topic_id !== undefined && b.topic_id !== null && b.topic_id !== '' && !isPositiveInt(b.topic_id)) errors.push('topic_id phải là số nguyên dương');
  if (errors.length) return fail(next, errors);
  next();
}

function validateTestQuestion(req, res, next) {
  const b = req.body || {};
  const errors = [];
  if (!isPositiveInt(b.test_set_id)) errors.push('test_set_id phải là số nguyên dương');
  if (!['multiple_choice', 'fill_blank'].includes(b.question_type)) errors.push('question_type phải là multiple_choice hoặc fill_blank');
  if (!isStr(b.question_text)) errors.push('question_text là bắt buộc');
  else if (b.question_text.length > 3000) errors.push('question_text tối đa 3000 ký tự');
  if (!isStr(String(b.correct_answer ?? ''))) errors.push('correct_answer là bắt buộc');
  if (b.question_type === 'fill_blank' && String(b.correct_answer ?? '').length > 255) errors.push('correct_answer tối đa 255 ký tự');
  if (b.passage_text && String(b.passage_text).length > 10000) errors.push('passage_text tối đa 10.000 ký tự');
  if (errors.length) return fail(next, errors);
  next();
}

function validateIdParam(req, res, next) {
  if (!isPositiveInt(req.params.id)) return next(new AppError('id không hợp lệ', 400));
  req.params.id = Number(req.params.id);
  next();
}

module.exports = { validateReading, validateVocabulary, validateTestQuestion, validateIdParam };
