// src/common/models/test_questions.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestQuestion = sequelize.define('TestQuestion', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    test_set_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    question_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'multiple_choice, fill_blank, essay, speaking_prompt...'
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true
    },
    correct_answer: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    passage_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    order_index: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'test_questions',
    timestamps: false,
    indexes: [
      {
        name: 'idx_testq_set',
        fields: ['test_set_id', 'order_index']
      }
    ]
  });

  TestQuestion.associate = (models) => {
    TestQuestion.belongsTo(models.TestSet, {
      foreignKey: 'test_set_id',
      as: 'testSet',
      onDelete: 'CASCADE'
    });
  };

  return TestQuestion;
};

