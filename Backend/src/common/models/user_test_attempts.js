// src/common/models/user_test_attempts.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserTestAttempt = sequelize.define('UserTestAttempt', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    test_set_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    band_score: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      comment: 'quy đổi IELTS band hoặc điểm TOEIC'
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'submitted'),
      allowNull: false,
      defaultValue: 'in_progress'
    }
  }, {
    tableName: 'user_test_attempts',
    timestamps: false,
    indexes: [
      {
        name: 'idx_test_attempt_user',
        fields: ['user_id', 'started_at']
      }
    ]
  });

  UserTestAttempt.associate = (models) => {
    UserTestAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    UserTestAttempt.belongsTo(models.TestSet, {
      foreignKey: 'test_set_id',
      as: 'testSet',
      onDelete: 'CASCADE'
    });
  };

  return UserTestAttempt;
};

