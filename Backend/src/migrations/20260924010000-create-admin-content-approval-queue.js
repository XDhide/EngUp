'use strict';

const TABLE = 'admin_content_approval_queue';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((t) => String(t).toLowerCase());
    if (tables.includes(TABLE)) return; // idempotent: bảng đã có (vd. do db:sync tạo)

    await queryInterface.createTable(TABLE, {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      content_type: {
        type: Sequelize.ENUM('reading_article', 'test_question'),
        allowNull: false
      },
      content_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      reject_reason: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      reviewed_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex(TABLE, ['status', 'content_type'], { name: 'idx_queue_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE);
  }
};
