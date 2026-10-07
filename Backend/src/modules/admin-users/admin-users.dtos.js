function toUserListItemDto(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    level_current: user.level_current,
    is_active: user.is_active,
    created_at: user.created_at
  };
}

function toUserDetailDto(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    level_current: user.level_current,
    learning_goal: user.learning_goal,
    daily_target_minutes: user.daily_target_minutes,
    daily_new_word_limit: user.daily_new_word_limit,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

module.exports = {
  toUserListItemDto,
  toUserDetailDto
};
