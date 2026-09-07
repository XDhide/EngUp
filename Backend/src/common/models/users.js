// src/common/models/users.js
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
    // 1 user có nhiều refresh tokens
    User.hasMany(models.RefreshToken, {
      foreignKey: 'user_id',
      as: 'refreshTokens',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều kết quả placement test
    User.hasMany(models.PlacementTestResult, {
      foreignKey: 'user_id',
      as: 'placementTestResults',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều thẻ từ vựng (SRS)
    User.hasMany(models.UserVocabularyCard, {
      foreignKey: 'user_id',
      as: 'vocabularyCards',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều nhật ký ôn tập
    User.hasMany(models.ReviewLog, {
      foreignKey: 'user_id',
      as: 'reviewLogs',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều ghi chú sổ tay
    User.hasMany(models.PersonalNotebookEntry, {
      foreignKey: 'user_id',
      as: 'notebookEntries',
      onDelete: 'CASCADE'
    });

    // 1 admin có thể tạo nhiều bài đọc
    User.hasMany(models.ReadingArticle, {
      foreignKey: 'created_by',
      as: 'createdArticles',
      onDelete: 'SET NULL'
    });

    // 1 user có nhiều lượt làm bài đọc
    User.hasMany(models.ReadingAttempt, {
      foreignKey: 'user_id',
      as: 'readingAttempts',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều lượt làm bài nghe chép chính tả
    User.hasMany(models.ListeningDictationAttempt, {
      foreignKey: 'user_id',
      as: 'dictationAttempts',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều log dự đoán ML
    User.hasMany(models.MlPredictionLog, {
      foreignKey: 'user_id',
      as: 'mlPredictionLogs',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều bài nộp viết
    User.hasMany(models.WritingSubmission, {
      foreignKey: 'user_id',
      as: 'writingSubmissions',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều lượt làm test
    User.hasMany(models.UserTestAttempt, {
      foreignKey: 'user_id',
      as: 'testAttempts',
      onDelete: 'CASCADE'
    });

    // 1 user có 1 streak
    User.hasOne(models.Streak, {
      foreignKey: 'user_id',
      as: 'streak',
      onDelete: 'CASCADE'
    });

    // 1 user có 1 cài đặt thông báo
    User.hasOne(models.NotificationSetting, {
      foreignKey: 'user_id',
      as: 'notificationSetting',
      onDelete: 'CASCADE'
    });

    // 1 user có nhiều thông báo
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications',
      onDelete: 'CASCADE'
    });

    // 1 admin có nhiều audit log
    User.hasMany(models.AuditLog, {
      foreignKey: 'actor_id',
      as: 'auditLogs',
      onDelete: 'CASCADE'
    });

    // 1 admin có thể duyệt nhiều hàng đợi duyệt nội dung
    User.hasMany(models.AdminContentApprovalQueue, {
      foreignKey: 'reviewed_by',
      as: 'reviewedApprovals',
      onDelete: 'SET NULL'
    });

    // 1 user có nhiều lượt đăng ký gói học
    User.hasMany(models.Subscription, {
      foreignKey: 'user_id',
      as: 'subscriptions',
      onDelete: 'CASCADE'
    });
  };

  return User;
};

