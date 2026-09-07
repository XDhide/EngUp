// src/common/models/personal_notebook_entries.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PersonalNotebookEntry = sequelize.define('PersonalNotebookEntry', {
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
    source_type: {
      type: DataTypes.ENUM('vocabulary', 'reading', 'listening', 'manual'),
      allowNull: false,
      defaultValue: 'manual'
    },
    source_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'id bài đọc/nghe nếu source_type tương ứng'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'personal_notebook_entries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_notebook_user_date',
        fields: ['user_id', 'created_at']
      }
    ]
  });

  PersonalNotebookEntry.associate = (models) => {
    PersonalNotebookEntry.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    PersonalNotebookEntry.belongsTo(models.VocabularyWord, {
      foreignKey: 'word_id',
      as: 'word',
      onDelete: 'CASCADE'
    });
  };

  return PersonalNotebookEntry;
};

