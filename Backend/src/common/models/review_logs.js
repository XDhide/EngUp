// src/common/models/review_logs.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReviewLog = sequelize.define('ReviewLog', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    card_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    word_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    result: {
      type: DataTypes.ENUM('again', 'hard', 'good', 'easy'),
      allowNull: false
    },
    response_time_ms: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'review_logs',
    timestamps: false,
    indexes: [
      {
        name: 'idx_log_user_date',
        fields: ['user_id', 'reviewed_at']
      }
    ]
  });

  ReviewLog.associate = (models) => {
    ReviewLog.belongsTo(models.UserVocabularyCard, {
      foreignKey: 'card_id',
      as: 'card',
      onDelete: 'CASCADE'
    });

    ReviewLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    ReviewLog.belongsTo(models.VocabularyWord, {
      foreignKey: 'word_id',
      as: 'word',
      onDelete: 'CASCADE'
    });
  };

  return ReviewLog;
};

