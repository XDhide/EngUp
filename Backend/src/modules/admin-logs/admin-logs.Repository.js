const { Op } = require('sequelize');
const { ErrorLog, AuditLog } = require('../../common/models');

// ---------- Error log (bảng do module này sở hữu) ----------

async function findErrorLogs({ service, from, to, limit }) {
  const where = {};
  if (service) where.service = service;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = from;
    if (to) where.created_at[Op.lte] = to;
  }

  return ErrorLog.findAll({
    where,
    attributes: ['service', 'level', 'message', 'created_at'], // không trả stack_trace
    order: [
      ['created_at', 'DESC'], // mới nhất trước
      ['id', 'DESC']
    ],
    limit
  });
}

// ---------- Audit log (bảng do Admin sở hữu -> CHỈ ĐỌC) ----------

async function findAuditLogs({ actor_id, action, limit }) {
  const where = {};
  if (actor_id) where.actor_id = actor_id;
  if (action) where.action = action;

  return AuditLog.findAll({
    where,
    attributes: ['actor_id', 'action', 'target_type', 'target_id', 'created_at'], // không trả detail
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC']
    ],
    limit
  });
}

module.exports = {
  findErrorLogs,
  findAuditLogs
};
