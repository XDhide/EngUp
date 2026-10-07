const repo = require('./notes.repository');
const AppError = require('../../common/utils/AppError');

const MAX_NOTES_PER_USER = Number(process.env.MAX_NOTES_PER_USER) || 500;

const blankToNull = (v) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

function toDto(n) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    color: n.color,
    is_pinned: !!n.is_pinned,
    ref_type: n.ref_type,
    ref_id: n.ref_id,
    ref_label: n.ref_label,
    created_at: n.created_at,
    updated_at: n.updated_at
  };
}

async function listNotes(userId, query) {
  const { notes, total } = await repo.findNotes(userId, {
    q: query.q ? String(query.q).trim().slice(0, 100) : undefined,
    ref_type: query.ref_type,
    ref_id: query.ref_id ? Number(query.ref_id) : undefined,
    pinned: query.pinned === undefined ? undefined : query.pinned === 'true',
    limit: query.limit ? Math.min(Number(query.limit), 100) : 50,
    offset: query.offset ? Number(query.offset) : 0
  });
  return { notes: notes.map(toDto), total };
}

async function createNote(userId, body) {
  if ((await repo.countNotes(userId)) >= MAX_NOTES_PER_USER) {
    throw new AppError(`Bạn đã đạt giới hạn ${MAX_NOTES_PER_USER} ghi chú. Hãy xoá bớt ghi chú cũ.`, 400);
  }
  const refType = body.ref_type || 'none';
  const note = await repo.createNote({
    user_id: userId,
    title: blankToNull(body.title) ?? null,
    content: body.content.trim(),
    color: body.color || null,
    is_pinned: !!body.is_pinned,
    ref_type: refType,
    ref_id: refType === 'none' ? null : body.ref_id ?? null,
    ref_label: refType === 'none' ? null : blankToNull(body.ref_label) ?? null
  });
  return toDto(note);
}

async function updateNote(userId, id, body) {
  const note = await repo.findByIdForUser(id, userId);
  if (!note) throw new AppError('Ghi chú không tồn tại', 404);
  const fields = {};
  if (body.content !== undefined) fields.content = body.content.trim();
  if (body.title !== undefined) fields.title = blankToNull(body.title);
  if (body.color !== undefined) fields.color = body.color;
  if (body.is_pinned !== undefined) fields.is_pinned = body.is_pinned;
  if (body.ref_type !== undefined) {
    fields.ref_type = body.ref_type;
    if (body.ref_type === 'none') { fields.ref_id = null; fields.ref_label = null; }
  }
  if (fields.ref_type !== 'none') {
    if (body.ref_id !== undefined) fields.ref_id = body.ref_id;
    if (body.ref_label !== undefined) fields.ref_label = blankToNull(body.ref_label);
  }
  return toDto(await repo.updateNote(note, fields));
}

async function deleteNote(userId, id) {
  const note = await repo.findByIdForUser(id, userId);
  if (!note) throw new AppError('Ghi chú không tồn tại', 404);
  await repo.deleteNote(note);
  return null;
}

module.exports = { listNotes, createNote, updateNote, deleteNote, toDto };
