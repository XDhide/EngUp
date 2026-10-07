function toErrorLogDto(log) {
  return {
    service: log.service,
    level: log.level,
    message: log.message,
    created_at: log.created_at
  };
}

function toAuditLogDto(log) {
  return {
    actor_id: Number(log.actor_id),
    action: log.action,
    target_type: log.target_type,
    target_id: Number(log.target_id),
    created_at: log.created_at
  };
}

module.exports = {
  toErrorLogDto,
  toAuditLogDto
};
