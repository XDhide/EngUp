'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

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
