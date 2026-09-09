const { PersonalNotebookEntry, VocabularyWord, UserVocabularyCard, sequelize, Sequelize } = require('../../common/models');
const { Op } = Sequelize;

async function findVocabularyWordById(wordId) {
  return VocabularyWord.findByPk(wordId);
}

async function findUserVocabularyCard(userId, wordId) {
  return UserVocabularyCard.findOne({ where: { user_id: userId, word_id: wordId } });
}

async function createDefaultUserVocabularyCard(userId, wordId) {
  return UserVocabularyCard.create({ user_id: userId, word_id: wordId });
}

async function createEntry({ user_id, word_id, source_type, source_id, note, tags }) {
  return PersonalNotebookEntry.create({ user_id, word_id, source_type, source_id, note, tags });
}

async function findAllByUser(userId, { source_type, tag, date_from, date_to } = {}) {
  const where = { user_id: userId };

  if (source_type) {
    where.source_type = source_type;
  }

  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at[Op.gte] = new Date(date_from);
    if (date_to) where.created_at[Op.lte] = new Date(date_to);
  }

  const andConditions = [];
  if (tag) {
    andConditions.push(sequelize.where(sequelize.fn('JSON_CONTAINS', sequelize.col('tags'), JSON.stringify(tag)), 1));
  }

  return PersonalNotebookEntry.findAll({
    where: andConditions.length > 0 ? { [Op.and]: [where, ...andConditions] } : where,
    order: [['created_at', 'DESC']]
  });
}

async function findByIdAndUser(id, userId) {
  return PersonalNotebookEntry.findOne({ where: { id, user_id: userId } });
}

async function updateEntry(entry, fieldsToUpdate) {
  await entry.update(fieldsToUpdate);
  return entry;
}

async function deleteEntry(entry) {
  return entry.destroy();
}

module.exports = {
  findVocabularyWordById,
  findUserVocabularyCard,
  createDefaultUserVocabularyCard,
  createEntry,
  findAllByUser,
  findByIdAndUser,
  updateEntry,
  deleteEntry
};
