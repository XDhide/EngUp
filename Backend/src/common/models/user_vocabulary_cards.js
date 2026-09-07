// src/common/models/user_vocabulary_cards.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserVocabularyCard = sequelize.define('UserVocabularyCard', {
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
    ease_factor: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 2.50,
      comment: 'dùng khi fallback SM-2'
    },
    interval_days: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    repetitions: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    half_life_hours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'dùng cho model Half-Life Regression (ML-Service)'
    },
    recall_probability: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      comment: 'kết quả /predict gần nhất'
    },
    next_review_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_vocabulary_cards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        name: 'uq_user_word',
        fields: ['user_id', 'word_id']
      },
      {
        name: 'idx_card_next_review',
        fields: ['user_id', 'next_review_at']
      }
    ]
  });

  UserVocabularyCard.associate = (models) => {
    UserVocabularyCard.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    UserVocabularyCard.belongsTo(models.VocabularyWord, {
      foreignKey: 'word_id',
      as: 'word',
      onDelete: 'CASCADE'
    });

    UserVocabularyCard.hasMany(models.ReviewLog, {
      foreignKey: 'card_id',
      as: 'reviewLogs',
      onDelete: 'CASCADE'
    });
  };

  return UserVocabularyCard;
};

