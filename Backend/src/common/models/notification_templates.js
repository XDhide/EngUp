// src/common/models/notification_templates.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationTemplate = sequelize.define('NotificationTemplate', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    title_template: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    body_template: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    tableName: 'notification_templates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return NotificationTemplate;
};

