// src/common/models/reading_attempts.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReadingAttempt = sequelize.define('ReadingAttempt', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    article_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    correct_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    total_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'reading_attempts',
    timestamps: false,
    indexes: [
      {
        name: 'idx_reading_attempt_user',
        fields: ['user_id', 'submitted_at']
      }
    ]
  });

  ReadingAttempt.associate = (models) => {
    ReadingAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    ReadingAttempt.belongsTo(models.ReadingArticle, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE'
    });
  };

  return ReadingAttempt;
};

