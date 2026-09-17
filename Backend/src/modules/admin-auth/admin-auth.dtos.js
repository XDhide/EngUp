function toAdminUserDto(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role
  };
}

module.exports = {
  toAdminUserDto
};
