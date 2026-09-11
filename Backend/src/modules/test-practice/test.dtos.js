function toTestSetListItemDto(testSet) {
  return {
    id: testSet.id,
    title: testSet.title,
    section: testSet.section,
    time_limit_minutes: testSet.time_limit_minutes
  };
}

// Ẩn correct_answer khi trả câu hỏi cho học viên làm bài
function toQuestionForAttemptDto(question) {
  return {
    id: question.id,
    question_text: question.question_text,
    question_type: question.question_type,
    options: question.options,
    audio_url: question.audio_url,
    passage_text: question.passage_text,
    order_index: question.order_index
  };
}

function toAttemptListItemDto(attempt) {
  return {
    id: attempt.id,
    test_set_id: attempt.test_set_id,
    status: attempt.status,
    score: attempt.score,
    band_score: attempt.band_score,
    started_at: attempt.started_at,
    submitted_at: attempt.submitted_at
  };
}

module.exports = {
  toTestSetListItemDto,
  toQuestionForAttemptDto,
  toAttemptListItemDto
};
