// src/common/models/writing_submissions.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WritingSubmission = sequelize.define('WritingSubmission', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    prompt_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ai_feedback: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '{overall_comment, grammar_errors:[...], vocabulary_suggestions:[...], band_estimate}'
    },
    ai_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    }
  }, {
    tableName: 'writing_submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_writing_user_date',
        fields: ['user_id', 'created_at']
      }
    ]
  });

  WritingSubmission.associate = (models) => {
    WritingSubmission.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    WritingSubmission.belongsTo(models.WritingPrompt, {
      foreignKey: 'prompt_id',
      as: 'prompt',
      onDelete: 'CASCADE'
    });
  };

  return WritingSubmission;
};

