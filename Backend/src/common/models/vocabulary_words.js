// src/common/models/vocabulary_words.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VocabularyWord = sequelize.define('VocabularyWord', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    topic_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    word: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    phonetic: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    meaning: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    example_sentence: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    difficulty: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'A1..C2'
    }
  }, {
    tableName: 'vocabulary_words',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_word_topic',
        fields: ['topic_id']
      },
      {
        name: 'idx_word_difficulty',
        fields: ['difficulty']
      }
    ]
  });

  VocabularyWord.associate = (models) => {
    VocabularyWord.belongsTo(models.VocabularyTopic, {
      foreignKey: 'topic_id',
      as: 'topic',
      onDelete: 'SET NULL'
    });

    VocabularyWord.hasMany(models.UserVocabularyCard, {
      foreignKey: 'word_id',
      as: 'cards',
      onDelete: 'CASCADE'
    });

    VocabularyWord.hasMany(models.ReviewLog, {
      foreignKey: 'word_id',
      as: 'reviewLogs',
      onDelete: 'CASCADE'
    });

    VocabularyWord.hasMany(models.PersonalNotebookEntry, {
      foreignKey: 'word_id',
      as: 'notebookEntries',
      onDelete: 'CASCADE'
    });

    VocabularyWord.hasMany(models.MlPredictionLog, {
      foreignKey: 'word_id',
      as: 'mlPredictionLogs',
      onDelete: 'CASCADE'
    });
  };

  return VocabularyWord;
};

