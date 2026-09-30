function toArticleListItemDto(article) {
  return {
    id: article.id,
    title: article.title,
    difficulty: article.difficulty,
    topic: article.topic
  };
}

function toArticleDetailDto(article) {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    questions: (article.questions || []).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options
    }))
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
    questions: (article.questions || []).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation
    }))
  };
}

module.exports = {
  toArticleListItemDto,
  toArticleDetailDto,
  toArticleAdminDto
};