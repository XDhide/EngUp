// src/common/models/reading_articles.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReadingArticle = sequelize.define('ReadingArticle', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
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
    },
    is_ai_generated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'FALSE nếu do AI sinh và đang chờ admin duyệt'
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'admin tạo tay, NULL nếu do AI sinh'
    }
  }, {
    tableName: 'reading_articles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_article_filter',
        fields: ['difficulty', 'topic', 'is_approved']
      }
    ]
  });

  ReadingArticle.associate = (models) => {
    ReadingArticle.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL'
    });

    ReadingArticle.hasMany(models.ReadingQuestion, {
      foreignKey: 'article_id',
      as: 'questions',
      onDelete: 'CASCADE'
    });

    ReadingArticle.hasMany(models.ReadingAttempt, {
      foreignKey: 'article_id',
      as: 'attempts',
      onDelete: 'CASCADE'
    });
  };

  return ReadingArticle;
};

