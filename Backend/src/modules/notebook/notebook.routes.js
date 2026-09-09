const express = require('express');
const router = express.Router();

const notebookController = require('./notebook.controller');
const {
  validateCreateEntry,
  validateListQuery,
  validateIdParam,
  validateUpdateEntry
} = require('./notebook.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

router.post('/', authenticateJWT, validateCreateEntry, notebookController.createEntry);
router.get('/', authenticateJWT, validateListQuery, notebookController.getEntries);
router.put('/:id', authenticateJWT, validateIdParam, validateUpdateEntry, notebookController.updateEntry);
router.delete('/:id', authenticateJWT, validateIdParam, notebookController.deleteEntry);

module.exports = router;
