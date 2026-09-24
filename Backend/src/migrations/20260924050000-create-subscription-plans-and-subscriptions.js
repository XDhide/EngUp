'use strict';

const PLANS = 'subscription_plans';
const SUBSCRIPTIONS = 'subscriptions';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((t) => String(t).toLowerCase());

    if (!tables.includes(PLANS)) {
      await queryInterface.createTable(PLANS, {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        duration_days: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false
        },
        features: {
          type: Sequelize.JSON,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    }

    if (!tables.includes(SUBSCRIPTIONS)) {
      await queryInterface.createTable(SUBSCRIPTIONS, {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        user_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        plan_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: PLANS, key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        status: {
          type: Sequelize.ENUM('active', 'expired', 'cancelled'),
          allowNull: false,
          defaultValue: 'active'
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      await queryInterface.addIndex(SUBSCRIPTIONS, ['user_id', 'status'], { name: 'idx_subscription_user_status' });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable(SUBSCRIPTIONS); // xoá bảng con trước (FK -> plans)
    await queryInterface.dropTable(PLANS);
  }
};
