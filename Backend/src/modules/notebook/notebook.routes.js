const express = require('express');
const router = express.Router();

const notebookController = require('./notebook.controller');
const { validateCreateEntry } = require('./notebook.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

// POST /api/notebook
router.post('/', authenticateJWT, validateCreateEntry, notebookController.createEntry);

module.exports = router;
