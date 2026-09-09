function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name
  };
}

function toProfileUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    level_current: user.level_current,
    learning_goal: user.learning_goal,
    daily_target_minutes: user.daily_target_minutes,
    daily_new_word_limit: user.daily_new_word_limit
  };
}

function toPlacementTestQuestionDto(question) {
  return {
    id: question.id,
    question_text: question.question_text,
    options: question.options.map(({ id, text }) => ({ id, text }))
  };
}

module.exports = {
  toPublicUser,
  toProfileUser,
  toPlacementTestQuestionDto
};
