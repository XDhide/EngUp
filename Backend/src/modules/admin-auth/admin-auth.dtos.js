// src/modules/admin-auth/admin-auth.dtos.js
// Map dữ liệu model User sang shape trả về cho client khi đăng nhập admin
// (ẩn password_hash, chỉ trả các field cần thiết).

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
