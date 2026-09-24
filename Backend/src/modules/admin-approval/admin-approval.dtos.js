function toQueueItemDto(item) {
  return {
    id: item.id,
    content_type: item.content_type,
    content_id: item.content_id,
    created_at: item.created_at
  };
}

module.exports = {
  toQueueItemDto
};
