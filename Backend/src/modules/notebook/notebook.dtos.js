// Thông tin từ vựng đi kèm entry (chỉ có khi repository đã include quan hệ `word`).
function toEntryWordDto(word) {
  return {
    id: word.id,
    topic_id: word.topic_id,
    word: word.word,
    phonetic: word.phonetic,
    meaning: word.meaning,
    example_sentence: word.example_sentence,
    audio_url: word.audio_url,
    difficulty: word.difficulty
  };
}

function toEntryDto(entry) {
  const dto = {
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
  if (entry.word) dto.word = toEntryWordDto(entry.word);
  return dto;
}

module.exports = {
  toEntryDto
};
