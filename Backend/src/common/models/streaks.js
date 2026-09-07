// src/common/models/streaks.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Streak = sequelize.define('Streak', {
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
    current_streak: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    longest_streak: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    last_active_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    frozen_until: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'cho phép đóng băng streak khi user nghỉ có phép'
    }
  }, {
    tableName: 'streaks',
    timestamps: false
  });

  Streak.associate = (models) => {
    Streak.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return Streak;
};

