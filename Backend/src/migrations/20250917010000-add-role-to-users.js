// src/migrations/20250917010000-add-role-to-users.js
// Migration do module Admin đóng góp: chỉ thêm cột `role` vào bảng `users`.
// Model User vẫn do Module Auth sở hữu (src/common/models/users.js) — migration này
// KHÔNG chỉnh sửa model, chỉ đảm bảo cấu trúc bảng ở DB khớp với model đã khai báo sẵn
// cột `role` (ENUM('student','admin'), mặc định 'student').

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    // Idempotent: nếu cột role đã tồn tại (vd DB được tạo từ schema SQL mới) thì bỏ qua.
    if (!table.role) {
      await queryInterface.addColumn('users', 'role', {
        type: Sequelize.ENUM('student', 'admin'),
        allowNull: false,
        defaultValue: 'student'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');

    if (table.role) {
      await queryInterface.removeColumn('users', 'role');
    }
  }
};
