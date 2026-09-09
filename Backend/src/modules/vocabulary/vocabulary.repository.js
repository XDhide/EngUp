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