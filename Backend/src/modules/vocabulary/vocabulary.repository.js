const { Op } = require('sequelize');
const {
  VocabularyTopic,
  VocabularyWord,
  UserVocabularyCard,
  ReviewLog,
  User,
  sequelize
} = require('../../common/models');

// ---------- Topics ----------

async function findAllTopics() {
  return VocabularyTopic.findAll({ order: [['name', 'ASC']] });
}

async function findTopicById(id) {
  return VocabularyTopic.findByPk(id);
}

async function createTopic(data) {
  return VocabularyTopic.create(data);
}

async function updateTopic(topic, fieldsToUpdate) {
  await topic.update(fieldsToUpdate);
  return topic;
}

async function deleteTopic(topic) {
  // FK vocabulary_words -> vocabulary_topics là ON DELETE SET NULL, không cascade xoá từ.
  return topic.destroy();
}

// ---------- Words ----------

async function findWords({ topic_id, difficulty, limit = 20, offset = 0 } = {}) {
  const where = {};
  if (topic_id) where.topic_id = topic_id;
  if (difficulty) where.difficulty = difficulty;

  const { rows, count } = await VocabularyWord.findAndCountAll({
    where,
    limit,
    offset,
    order: [['id', 'ASC']]
  });

  return { words: rows, total: count };
}

async function findWordById(id) {
  return VocabularyWord.findByPk(id);
}

async function createWord(data) {
  return VocabularyWord.create(data);
}

async function updateWord(word, fieldsToUpdate) {
  await word.update(fieldsToUpdate);
  return word;
}

async function deleteWord(word) {
  // FK user_vocabulary_cards -> vocabulary_words là ON DELETE CASCADE ở DB,
  // Sequelize destroy() sẽ để DB tự cascade, không cần xoá tay ở đây.
  return word.destroy();
}

// ---------- User (chỉ đọc / update 1 cột daily_new_word_limit, không đụng field khác của Auth) ----------

async function findUserById(userId) {
  return User.findByPk(userId);
}

async function updateDailyNewWordLimit(userId, limit) {
  await User.update({ daily_new_word_limit: limit }, { where: { id: userId } });
  return User.findByPk(userId);
}

// ---------- New words (từ chưa có card của user) ----------

async function findNewWordsForUser(userId, limit) {
  return VocabularyWord.findAll({
    where: {
      id: {
        [Op.notIn]: sequelize.literal(
          `(SELECT word_id FROM user_vocabulary_cards WHERE user_id = ${sequelize.escape(userId)})`
        )
      }
    },
    order: [['id', 'ASC']],
    limit
  });
}

// ---------- Cards / Review (SRS) ----------

async function findCardsDueToday(userId) {
  return UserVocabularyCard.findAll({
    where: {
      user_id: userId,
      [Op.or]: [{ next_review_at: null }, { next_review_at: { [Op.lte]: new Date() } }]
    },
    include: [{ model: VocabularyWord, as: 'word' }],
    order: [['next_review_at', 'ASC']]
  });
}

async function findCardById(cardId) {
  return UserVocabularyCard.findByPk(cardId, { include: [{ model: VocabularyWord, as: 'word' }] });
}

async function updateCardAfterReview(card, fieldsToUpdate) {
  await card.update(fieldsToUpdate);
  return card;
}

async function createReviewLog({ card_id, user_id, word_id, result, response_time_ms }) {
  return ReviewLog.create({ card_id, user_id, word_id, result, response_time_ms });
}

module.exports = {
  findAllTopics,
  findTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  findWords,
  findWordById,
  createWord,
  updateWord,
  deleteWord,
  findUserById,
  updateDailyNewWordLimit,
  findNewWordsForUser,
  findCardsDueToday,
  findCardById,
  updateCardAfterReview,
  createReviewLog
};