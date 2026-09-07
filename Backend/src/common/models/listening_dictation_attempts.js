// src/common/models/listening_dictation_attempts.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ListeningDictationAttempt = sequelize.define('ListeningDictationAttempt', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    lesson_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    user_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    accuracy_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    wrong_words: {
      type: DataTypes.JSON,
      allowNull: true
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'listening_dictation_attempts',
    timestamps: false
  });

  ListeningDictationAttempt.associate = (models) => {
    ListeningDictationAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    ListeningDictationAttempt.belongsTo(models.ListeningLesson, {
      foreignKey: 'lesson_id',
      as: 'lesson',
      onDelete: 'CASCADE'
    });
  };

  return ListeningDictationAttempt;
};

