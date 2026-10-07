const express = require('express');
const controller = require('./notes.controller');
const { validateCreate, validateUpdate, validateListQuery, validateIdParam } = require('./notes.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const router = express.Router();
router.use(authenticateJWT);

router.get('/', validateListQuery, controller.list);
router.post('/', validateCreate, controller.create);
router.put('/:id', validateIdParam, validateUpdate, controller.update);
router.delete('/:id', validateIdParam, controller.remove);

module.exports = router;
