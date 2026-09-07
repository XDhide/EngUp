// src/common/models/notification_settings.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationSetting = sequelize.define('NotificationSetting', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    daily_reminder_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    review_reminder_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    push_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Expo push token'
    }
  }, {
    tableName: 'notification_settings',
    timestamps: false
  });

  NotificationSetting.associate = (models) => {
    NotificationSetting.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return NotificationSetting;
};

