'use strict';

// Đặc tả duyệt nội dung yêu cầu set is_approved=true trên bảng nội dung tương ứng;
// test_questions chưa có cột này (reading_articles đã có sẵn).
// defaultValue=true để toàn bộ câu hỏi hiện có vẫn hiển thị như cũ.
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('test_questions');

    if (!table.is_approved) {
      await queryInterface.addColumn('test_questions', 'is_approved', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('test_questions');

    if (table.is_approved) {
      await queryInterface.removeColumn('test_questions', 'is_approved');
    }
  }
};
