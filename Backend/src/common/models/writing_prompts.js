// src/common/models/writing_prompts.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WritingPrompt = sequelize.define('WritingPrompt', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    prompt_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('free', 'ielts', 'toeic'),
      allowNull: false,
      defaultValue: 'free'
    },
    difficulty: {
      type: DataTypes.STRING(10),
      allowNull: true
    }
  }, {
    tableName: 'writing_prompts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  WritingPrompt.associate = (models) => {
    WritingPrompt.hasMany(models.WritingSubmission, {
      foreignKey: 'prompt_id',
      as: 'submissions',
      onDelete: 'CASCADE'
    });
  };

  return WritingPrompt;
};

