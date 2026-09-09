function toEntryDto(entry) {
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

module.exports = {
  toEntryDto
};
