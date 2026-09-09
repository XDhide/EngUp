// src/modules/notebook/notebook.service.js
// Service layer: chứa toàn bộ logic nghiệp vụ. Luôn lấy/ghi dữ liệu thông qua
// notebook.Repository.js, không import model trực tiếp ở đây.

const notebookRepository = require('./notebook.Repository');
const AppError = require('../../common/utils/AppError');

// Chuẩn hoá dữ liệu entry trả về cho client
function toEntryResponse(entry) {
  return {
    id: entry.id,
    user_id: entry.user_id,
    word_id: entry.word_id,
    source_type: entry.source_type,
    source_id: entry.source_id,
    note: entry.note,
    tags: entry.tags,
    created_at: entry.created_at,
    updated_at: entry.updated_at
  };
}

// ---- Lưu từ vào sổ tay ----
async function createEntry(userId, { word_id, source_type, source_id, note, tags }) {
  // Kiểm tra từ vựng có tồn tại không (đọc read-only, không đụng service của Vocabulary)
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

  // Nếu user chưa có user_vocabulary_cards cho word_id này thì tạo mới 1 bản ghi mặc định
  const existingCard = await notebookRepository.findUserVocabularyCard(userId, word_id);
  if (!existingCard) {
    await notebookRepository.createDefaultUserVocabularyCard(userId, word_id);
  }

  return toEntryResponse(entry);
}

module.exports = {
  createEntry
};
