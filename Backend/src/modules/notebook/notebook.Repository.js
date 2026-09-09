// src/modules/notebook/notebook.Repository.js
// Repository layer: lớp DUY NHẤT được phép truy vấn trực tiếp vào Sequelize models
// (personal_notebook_entries). Service layer không được gọi model trực tiếp mà
// luôn phải đi qua đây.
//
// Module notebook độc lập với module Vocabulary: không gọi service/API của
// Vocabulary. VocabularyWord chỉ được đọc read-only (kiểm tra tồn tại), còn
// UserVocabularyCard được ghi trực tiếp qua tầng data layer dùng chung theo
// đúng thiết kế đã mô tả (tạo bản ghi mặc định khi user lưu từ lần đầu).

const { PersonalNotebookEntry, VocabularyWord, UserVocabularyCard } = require('../../common/models');

// ---- Vocabulary (read-only, tham chiếu FK) ----

async function findVocabularyWordById(wordId) {
  return VocabularyWord.findByPk(wordId);
}

// ---- User Vocabulary Card (ghi trực tiếp qua data layer dùng chung) ----

async function findUserVocabularyCard(userId, wordId) {
  return UserVocabularyCard.findOne({ where: { user_id: userId, word_id: wordId } });
}

async function createDefaultUserVocabularyCard(userId, wordId) {
  return UserVocabularyCard.create({ user_id: userId, word_id: wordId });
}

// ---- Personal Notebook Entry ----

async function createEntry({ user_id, word_id, source_type, source_id, note, tags }) {
  return PersonalNotebookEntry.create({ user_id, word_id, source_type, source_id, note, tags });
}

module.exports = {
  findVocabularyWordById,
  findUserVocabularyCard,
  createDefaultUserVocabularyCard,
  createEntry
};
