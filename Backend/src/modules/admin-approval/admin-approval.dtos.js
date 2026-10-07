function toQueueItemDto(item) {
  return {
    id: item.id,
    content_type: item.content_type,
    content_id: item.content_id,
    created_at: item.created_at,
    title: item.title || null,
    submitted_by: item.submitted_by || null,
    submitter_name: item.submitter ? (item.submitter.full_name || item.submitter.email) : null
  };
}

module.exports = {
  toQueueItemDto
};
