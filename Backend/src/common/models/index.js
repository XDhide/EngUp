// src/common/models/index.js
const { Sequelize } = require('sequelize');
const { sequelize } = require('../../config/db');

const db = {};

// Import và khởi tạo từng model
db.User = require('./users')(sequelize);
db.RefreshToken = require('./refresh_tokens')(sequelize);
db.PlacementTestResult = require('./placement_test_results')(sequelize);

db.VocabularyTopic = require('./vocabulary_topics')(sequelize);
db.VocabularyWord = require('./vocabulary_words')(sequelize);
db.UserVocabularyCard = require('./user_vocabulary_cards')(sequelize);
db.ReviewLog = require('./review_logs')(sequelize);

db.PersonalNotebookEntry = require('./personal_notebook_entries')(sequelize);

db.ReadingArticle = require('./reading_articles')(sequelize);
db.ReadingQuestion = require('./reading_questions')(sequelize);
db.ReadingAttempt = require('./reading_attempts')(sequelize);

db.ListeningLesson = require('./listening_lessons')(sequelize);
db.ListeningDictationAttempt = require('./listening_dictation_attempts')(sequelize);

db.MlPredictionLog = require('./ml_prediction_logs')(sequelize);

db.WritingPrompt = require('./writing_prompts')(sequelize);
db.WritingSubmission = require('./writing_submissions')(sequelize);

db.TestSet = require('./test_sets')(sequelize);
db.TestQuestion = require('./test_questions')(sequelize);
db.UserTestAttempt = require('./user_test_attempts')(sequelize);

db.Streak = require('./streaks')(sequelize);

db.NotificationSetting = require('./notification_settings')(sequelize);
db.Notification = require('./notifications')(sequelize);
db.NotificationTemplate = require('./notification_templates')(sequelize);

db.AuditLog = require('./audit_logs')(sequelize);
db.AdminContentApprovalQueue = require('./admin_content_approval_queue')(sequelize);
db.ErrorLog = require('./error_logs')(sequelize);

db.SubscriptionPlan = require('./subscription_plans')(sequelize);
db.Subscription = require('./subscriptions')(sequelize);

// Thiết lập các quan hệ (Associations / Foreign Keys)
Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Hàm tiện ích đồng bộ cấu trúc database với models
db.syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Đồng bộ Database thành công!');
  } catch (error) {
    console.error('❌ Đồng bộ Database thất bại:', error.message);
    throw error;
  }
};

module.exports = db;

