const { Op } = require('sequelize');
const {
  VocabularyTopic,
  VocabularyWord,
  UserVocabularyCard,
  ReviewLog,
  User,
  sequelize
} = require('../../common/models');

async function findAllTopics() {
  return VocabularyTopic.findAll({ order: [['name', 'ASC']] });
}

async function findTopicById(id) {
  return VocabularyTopic.findByPk(id);
}

async function findTopicByName(name) {
  return VocabularyTopic.findOne({ where: { name } });
}

async function createTopic(data) {
  return VocabularyTopic.create(data);
}

async function updateTopic(topic, fields) {
  await topic.update(fields);
  return topic;
}

async function deleteTopic(topic) {
  // FK vocabulary_words.topic_id là ON DELETE SET NULL: từ vựng giữ lại, chỉ mất chủ đề.
  return topic.destroy();
}

async function countWordsInTopic(topicId) {
  return VocabularyWord.count({ where: { topic_id: topicId } });
}

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

async function findExistingWordTexts(texts) {
  if (!texts.length) return new Set();
  const rows = await VocabularyWord.findAll({ where: { word: { [Op.in]: texts } }, attributes: ['word'], raw: true });
  return new Set(rows.map((r) => String(r.word).toLowerCase()));
}

async function bulkCreateWords(items) {
  return VocabularyWord.bulkCreate(items);
}

async function updateWord(word, fieldsToUpdate) {
  await word.update(fieldsToUpdate);
  return word;
}

async function deleteWord(word) {
  return word.destroy();
}

async function findUserById(userId) {
  return User.findByPk(userId);
}

async function updateDailyNewWordLimit(userId, limit) {
  await User.update({ daily_new_word_limit: limit }, { where: { id: userId } });
  return User.findByPk(userId);
}

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

async function countCardsCreatedToday(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return UserVocabularyCard.count({
    where: { user_id: userId, created_at: { [Op.gte]: startOfDay } }
  });
}

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
  findWords,
  findWordById,
  findTopicById,
  findTopicByName,
  createTopic,
  updateTopic,
  deleteTopic,
  countWordsInTopic,
  createWord,
  findExistingWordTexts,
  bulkCreateWords,
  updateWord,
  deleteWord,
  findUserById,
  updateDailyNewWordLimit,
  findNewWordsForUser,
  countCardsCreatedToday,
  findCardsDueToday,
  findCardById,
  updateCardAfterReview,
  createReviewLog
};
