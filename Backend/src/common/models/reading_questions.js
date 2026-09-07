// src/common/models/reading_questions.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReadingQuestion = sequelize.define('ReadingQuestion', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    article_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    options: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '["A. ...","B. ...","C. ...","D. ..."]'
    },
    correct_answer: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'reading_questions',
    timestamps: false
  });

  ReadingQuestion.associate = (models) => {
    ReadingQuestion.belongsTo(models.ReadingArticle, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE'
    });
  };

  return ReadingQuestion;
};

