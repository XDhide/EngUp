// src/common/models/subscription_plans.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration_days: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'subscription_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  SubscriptionPlan.associate = (models) => {
    SubscriptionPlan.hasMany(models.Subscription, {
      foreignKey: 'plan_id',
      as: 'subscriptions',
      onDelete: 'CASCADE'
    });
  };

  return SubscriptionPlan;
};

