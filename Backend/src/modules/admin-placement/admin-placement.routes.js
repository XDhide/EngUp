const express = require('express');
const controller = require('./admin-placement.controller');
const { validateCreate, validateUpdate, validateIdParam } = require('./admin-placement.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const requireRole = require('../../common/middlewares/role.middleware');

const router = express.Router();
router.use(authenticateJWT, requireRole('admin'));

router.get('/questions', controller.list);
router.post('/questions', validateCreate, controller.create);
router.put('/questions/:id', validateIdParam, validateUpdate, controller.update);
router.delete('/questions/:id', validateIdParam, controller.remove);
router.get('/stats', controller.stats);

module.exports = router;
