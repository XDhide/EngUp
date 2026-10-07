const notebookService = require('./notebook.service');
const { successResponse } = require('../../common/utils/response');

async function createEntry(req, res, next) {
  try {
    const { word_id, source_type, source_id, note, tags } = req.body;

    const data = await notebookService.createEntry(req.user.id, {
      word_id,
      source_type,
      source_id,
      note,
      tags
    });

    return successResponse(res, {
      message: 'Lưu từ vào sổ tay thành công',
      data,
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
}

async function getEntries(req, res, next) {
  try {
    const { source_type, tag, date_from, date_to } = req.query;

    const data = await notebookService.getEntries(req.user.id, { source_type, tag, date_from, date_to });

    return successResponse(res, {
      message: 'Lấy danh sách ghi chú sổ tay thành công',
      data,
      statusCode: 200
    });
  } catch (err) {
    next(err);
  }
}

async function updateEntry(req, res, next) {
  try {
    const { note, tags } = req.body;

    const data = await notebookService.updateEntry(req.user.id, req.params.id, { note, tags });

    return successResponse(res, {
      message: 'Cập nhật ghi chú sổ tay thành công',
      data,
      statusCode: 200
    });
  } catch (err) {
    next(err);
  }
}

async function deleteEntry(req, res, next) {
  try {
    const data = await notebookService.deleteEntry(req.user.id, req.params.id);

    return successResponse(res, {
      message: 'Xoá ghi chú sổ tay thành công',
      data,
      statusCode: 200
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEntry,
  getEntries,
  updateEntry,
  deleteEntry
};
