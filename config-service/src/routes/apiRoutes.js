const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const configController = require('../controllers/configController');
const tokenController = require('../controllers/tokenController');
const roomController = require('../controllers/roomController');
const healthController = require('../controllers/healthController');

// Config Routes
router.get('/config', configController.getConfig);
router.post('/config', authMiddleware, configController.updateConfig.bind(configController));
router.put('/config', authMiddleware, configController.replaceConfig.bind(configController));

// Token Routes
router.post('/generate-token', tokenController.generateToken.bind(tokenController));

// Room Routes
router.get('/room/:roomId/users', roomController.getUsers.bind(roomController));
router.get('/room/:roomId/user/:userId/isJoined', roomController.checkUserJoined.bind(roomController));

// Health/Utils Routes
router.get('/check-node-group-availability', healthController.checkNodeGroupAvailability.bind(healthController));
router.get('/health-check', healthController.check.bind(healthController));

module.exports = router;
