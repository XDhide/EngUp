// src/common/models/test_sets.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestSet = sequelize.define('TestSet', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    exam_type: {
      type: DataTypes.ENUM('IELTS', 'TOEIC'),
      allowNull: false
    },
    section: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Listening, Reading, Writing, Speaking...'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    time_limit_minutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    }
  }, {
    tableName: 'test_sets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  TestSet.associate = (models) => {
    TestSet.hasMany(models.TestQuestion, {
      foreignKey: 'test_set_id',
      as: 'questions',
      onDelete: 'CASCADE'
    });

    TestSet.hasMany(models.UserTestAttempt, {
      foreignKey: 'test_set_id',
      as: 'attempts',
      onDelete: 'CASCADE'
    });
  };

  return TestSet;
};

