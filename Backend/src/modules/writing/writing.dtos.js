function toPromptListItemDto(prompt) {
  return {
    id: prompt.id,
    title: prompt.title,
    prompt_text: prompt.prompt_text,
    difficulty: prompt.difficulty
  };
}

function toSubmissionResultDto(submission) {
  return {
    id: submission.id,
    ai_feedback: submission.ai_feedback,
    ai_score: submission.ai_score
  };
}

function toSubmissionDetailDto(submission) {
  return {
    id: submission.id,
    prompt_id: submission.prompt_id,
    content: submission.content,
    ai_feedback: submission.ai_feedback,
    ai_score: submission.ai_score,
    created_at: submission.created_at
  };
}

function toSubmissionListItemDto(submission) {
  return {
    id: submission.id,
    prompt_id: submission.prompt_id,
    ai_score: submission.ai_score,
    created_at: submission.created_at
  };
}

module.exports = {
  toPromptListItemDto,
  toSubmissionResultDto,
  toSubmissionDetailDto,
  toSubmissionListItemDto
};
