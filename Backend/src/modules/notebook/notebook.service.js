const notebookRepository = require('./notebook.Repository');
const AppError = require('../../common/utils/AppError');
const { toEntryDto } = require('./notebook.dtos');

async function createEntry(userId, { word_id, source_type, source_id, note, tags }) {
  const word = await notebookRepository.findVocabularyWordById(word_id);
  if (!word) {
    throw new AppError('Từ vựng không tồn tại', 404);
  }

  const entry = await notebookRepository.createEntry({
    user_id: userId,
    word_id,
    source_type,
    source_id: source_id ?? null,
    note: note ?? null,
    tags: tags ?? null
  });

  const existingCard = await notebookRepository.findUserVocabularyCard(userId, word_id);
  if (!existingCard) {
    await notebookRepository.createDefaultUserVocabularyCard(userId, word_id);
  }

  return toEntryDto(entry);
}

async function getEntries(userId, { source_type, tag, date_from, date_to }) {
  const entries = await notebookRepository.findAllByUser(userId, { source_type, tag, date_from, date_to });
  return { entries: entries.map(toEntryDto) };
}

async function updateEntry(userId, entryId, { note, tags }) {
  const entry = await notebookRepository.findByIdAndUser(entryId, userId);
  if (!entry) {
    throw new AppError('Ghi chú sổ tay không tồn tại', 404);
  }

  const fieldsToUpdate = {};
  if (note !== undefined) fieldsToUpdate.note = note;
  if (tags !== undefined) fieldsToUpdate.tags = tags;

  const updatedEntry = await notebookRepository.updateEntry(entry, fieldsToUpdate);
  return toEntryDto(updatedEntry);
}

async function deleteEntry(userId, entryId) {
  const entry = await notebookRepository.findByIdAndUser(entryId, userId);
  if (!entry) {
    throw new AppError('Ghi chú sổ tay không tồn tại', 404);
  }

  await notebookRepository.deleteEntry(entry);
  return null;
}

module.exports = {
  createEntry,
  getEntries,
  updateEntry,
  deleteEntry
};
