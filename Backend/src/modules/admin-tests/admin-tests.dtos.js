function toTestSetDto(testSet) {
  return {
    id: testSet.id,
    exam_type: testSet.exam_type,
    section: testSet.section,
    title: testSet.title,
    time_limit_minutes: testSet.time_limit_minutes,
    created_at: testSet.created_at
  };
}

// Admin được xem correct_answer (khác DTO dành cho học viên trong test-practice).
function toQuestionDto(question) {
  return {
    id: question.id,
    test_set_id: question.test_set_id,
    question_text: question.question_text,
    question_type: question.question_type,
    // `?? null`: bản ghi vừa create() chưa có các cột không gửi lên -> luôn trả đủ key như khi đọc từ DB.
    options: question.options ?? null,
    correct_answer: question.correct_answer ?? null,
    audio_url: question.audio_url ?? null,
    passage_text: question.passage_text ?? null,
    order_index: question.order_index,
    is_approved: question.is_approved
  };
}

// score / band_score là DECIMAL nên MySQL trả về chuỗi ("80.00") -> ép sang number.
function toNumberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

function toAttemptStatDto(attempt) {
  return {
    user_id: attempt.user_id,
    score: toNumberOrNull(attempt.score),
    band_score: toNumberOrNull(attempt.band_score),
    status: attempt.status
  };
}

module.exports = {
  toTestSetDto,
  toQuestionDto,
  toAttemptStatDto
};
