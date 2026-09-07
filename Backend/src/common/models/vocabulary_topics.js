// src/common/models/vocabulary_topics.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VocabularyTopic = sequelize.define('VocabularyTopic', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'vocabulary_topics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  VocabularyTopic.associate = (models) => {
    VocabularyTopic.hasMany(models.VocabularyWord, {
      foreignKey: 'topic_id',
      as: 'words',
      onDelete: 'SET NULL'
    });
  };

  return VocabularyTopic;
};

