function toArticleListItemDto(article) {
  return {
    id: article.id,
    title: article.title,
    difficulty: article.difficulty,
    topic: article.topic,
    is_ai_generated: article.is_ai_generated
  };
}

function toQuestionPublicDto(question) {
  return {
    id: question.id,
    question_text: question.question_text,
    options: question.options
  };
}

function toArticleDetailDto(article) {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    difficulty: article.difficulty,
    topic: article.topic,
    questions: (article.questions || []).map(toQuestionPublicDto)
  };
}

function toQuestionAdminDto(question) {
  return {
    id: question.id,
    question_text: question.question_text,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation
  };
}

function toArticleAdminDto(article) {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    difficulty: article.difficulty,
    topic: article.topic,
    is_ai_generated: article.is_ai_generated,
    is_approved: article.is_approved,
    questions: (article.questions || []).map(toQuestionAdminDto)
  };
}

module.exports = {
  toArticleListItemDto,
  toArticleDetailDto,
  toArticleAdminDto
};
