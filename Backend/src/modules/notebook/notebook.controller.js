// src/modules/notebook/notebook.controller.js
// Controller layer: chỉ nhận request -> gọi service -> trả response.
// Không chứa logic nghiệp vụ, không đụng tới model/repository trực tiếp.

const notebookService = require('./notebook.service');
const { successResponse } = require('../../common/utils/response');

// POST /api/notebook
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

module.exports = {
  createEntry
};
