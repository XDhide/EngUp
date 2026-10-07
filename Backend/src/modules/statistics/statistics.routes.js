const express = require('express');
const statisticsController = require('./statistics.controller');
const { validateProgressQuery } = require('./statistics.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const statisticsRouter = express.Router();

statisticsRouter.get('/overview', authenticateJWT, statisticsController.getOverview);
statisticsRouter.get('/progress', authenticateJWT, validateProgressQuery, statisticsController.getProgress);

module.exports = statisticsRouter;
