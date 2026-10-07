const { Op } = require('sequelize');
const { UserNote } = require('../../common/models');

async function findNotes(userId, { q, ref_type, ref_id, pinned, limit = 50, offset = 0 } = {}) {
  const where = { user_id: userId };
  if (ref_type) where.ref_type = ref_type;
  if (ref_id) where.ref_id = ref_id;
  if (pinned !== undefined) where.is_pinned = pinned;
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    where[Op.or] = [{ title: { [Op.like]: like } }, { content: { [Op.like]: like } }, { ref_label: { [Op.like]: like } }];
  }
  const { rows, count } = await UserNote.findAndCountAll({
    where,
    order: [['is_pinned', 'DESC'], ['updated_at', 'DESC'], ['id', 'DESC']],
    limit,
    offset
  });
  return { notes: rows, total: count };
}

const findByIdForUser = (id, userId) => UserNote.findOne({ where: { id, user_id: userId } });
const createNote = (data) => UserNote.create(data);
const updateNote = async (note, fields) => { await note.update(fields); return note; };
const deleteNote = (note) => note.destroy();
const countNotes = (userId) => UserNote.count({ where: { user_id: userId } });

module.exports = { findNotes, findByIdForUser, createNote, updateNote, deleteNote, countNotes };
