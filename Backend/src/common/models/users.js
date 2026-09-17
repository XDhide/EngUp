const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('student', 'admin'),
      allowNull: false,
      defaultValue: 'student'
    },
    level_current: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'A1..C2, kết quả placement test hoặc admin gán'
    },
    learning_goal: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    daily_target_minutes: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: true,
      defaultValue: 15
    },
    daily_new_word_limit: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 10
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {

    User.hasMany(models.RefreshToken, {
      foreignKey: 'user_id',
      as: 'refreshTokens',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.PlacementTestResult, {
      foreignKey: 'user_id',
      as: 'placementTestResults',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.UserVocabularyCard, {
      foreignKey: 'user_id',
      as: 'vocabularyCards',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ReviewLog, {
      foreignKey: 'user_id',
      as: 'reviewLogs',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.PersonalNotebookEntry, {
      foreignKey: 'user_id',
      as: 'notebookEntries',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ReadingArticle, {
      foreignKey: 'created_by',
      as: 'createdArticles',
      onDelete: 'SET NULL'
    });

    User.hasMany(models.ReadingAttempt, {
      foreignKey: 'user_id',
      as: 'readingAttempts',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ListeningDictationAttempt, {
      foreignKey: 'user_id',
      as: 'dictationAttempts',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.MlPredictionLog, {
      foreignKey: 'user_id',
      as: 'mlPredictionLogs',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.WritingSubmission, {
      foreignKey: 'user_id',
      as: 'writingSubmissions',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.UserTestAttempt, {
      foreignKey: 'user_id',
      as: 'testAttempts',
      onDelete: 'CASCADE'
    });

    User.hasOne(models.Streak, {
      foreignKey: 'user_id',
      as: 'streak',
      onDelete: 'CASCADE'
    });

    User.hasOne(models.NotificationSetting, {
      foreignKey: 'user_id',
      as: 'notificationSetting',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.AuditLog, {
      foreignKey: 'actor_id',
      as: 'auditLogs',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.AdminContentApprovalQueue, {
      foreignKey: 'reviewed_by',
      as: 'reviewedApprovals',
      onDelete: 'SET NULL'
    });

    User.hasMany(models.Subscription, {
      foreignKey: 'user_id',
      as: 'subscriptions',
      onDelete: 'CASCADE'
    });
  };

  return User;
};
