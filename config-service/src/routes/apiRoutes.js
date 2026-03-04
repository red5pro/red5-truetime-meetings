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
router.get(
  '/room/:roomId/user/:userId/isJoined',
  roomController.checkUserJoined.bind(roomController),
);

// External Stream Routes
router.get('/external-streams', roomController.getExternalStreams.bind(roomController));
router.post(
  '/room/:roomName/external-stream/:streamId',
  roomController.addExternalStream.bind(roomController),
);
router.delete(
  '/room/:roomName/external-stream/:streamId',
  roomController.removeExternalStream.bind(roomController),
);

// Recording Routes
router.post('/room/:roomName/startRecording', roomController.startRecording.bind(roomController));
router.post('/room/:roomName/stopRecording', roomController.stopRecording.bind(roomController));

// User Moderation Routes
router.post('/room/:roomName/user/:userId/block', roomController.blockUser.bind(roomController));
router.post(
  '/room/:roomName/user/:userId/unblock',
  roomController.unblockUser.bind(roomController),
);

// Transcription Routes
router.get('/room/:roomName/transcriptions', roomController.getTranscriptions.bind(roomController));
router.post(
  '/room/:roomName/user/:userId/start-transcription',
  roomController.startTranscription.bind(roomController),
);
router.post(
  '/room/:roomName/user/:userId/stop-transcription',
  roomController.stopTranscription.bind(roomController),
);

// Health/Utils Routes
router.get(
  '/check-node-group-availability',
  healthController.checkNodeGroupAvailability.bind(healthController),
);
router.get('/health-check', healthController.check.bind(healthController));

module.exports = router;
