'use strict';

const TABLE = 'error_logs';

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
      service: {
        type: Sequelize.ENUM('backend', 'ml-service'),
        allowNull: false
      },
      level: {
        type: Sequelize.ENUM('info', 'warning', 'error', 'critical'),
        allowNull: false,
        defaultValue: 'error'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      stack_trace: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex(TABLE, ['service', 'created_at'], { name: 'idx_error_service_date' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE);
  }
};
