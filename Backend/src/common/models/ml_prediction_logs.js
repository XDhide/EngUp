// src/common/models/ml_prediction_logs.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MlPredictionLog = sequelize.define('MlPredictionLog', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    word_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    recall_probability: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false
    },
    predicted_next_review_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used_fallback_sm2: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    model_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    actual_result: {
      type: DataTypes.ENUM('again', 'hard', 'good', 'easy'),
      allowNull: true,
      comment: 'điền sau khi user thực sự ôn, dùng để đo độ chính xác'
    },
    predicted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ml_prediction_logs',
    timestamps: false,
    indexes: [
      {
        name: 'idx_ml_log_user',
        fields: ['user_id', 'predicted_at']
      }
    ]
  });

  MlPredictionLog.associate = (models) => {
    MlPredictionLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    MlPredictionLog.belongsTo(models.VocabularyWord, {
      foreignKey: 'word_id',
      as: 'word',
      onDelete: 'CASCADE'
    });
  };

  return MlPredictionLog;
};

