// src/common/models/listening_lessons.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ListeningLesson = sequelize.define('ListeningLesson', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    transcript: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    difficulty: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    topic: {
      type: DataTypes.STRING(150),
      allowNull: true
    }
  }, {
    tableName: 'listening_lessons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_listening_filter',
        fields: ['difficulty', 'topic']
      }
    ]
  });

  ListeningLesson.associate = (models) => {
    ListeningLesson.hasMany(models.ListeningDictationAttempt, {
      foreignKey: 'lesson_id',
      as: 'dictationAttempts',
      onDelete: 'CASCADE'
    });
  };

  return ListeningLesson;
};

