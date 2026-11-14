import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import { requireConferenceToken } from '../middleware/conferenceTokenMiddleware.js';
import configController from '../controllers/configController.js';
import tokenController from '../controllers/tokenController.js';
import roomController from '../controllers/roomController.js';
import healthController from '../controllers/healthController.js';
import recordingUploadController from '../controllers/recordingUploadController.js';

// A conference token (from /generate-token) for the room in the path
const inRoom = (roomParam) => requireConferenceToken({ roomParam });
// The same, with the admin (host) role
const hostOf = (roomParam) => requireConferenceToken({ roomParam, roles: ['admin'] });

// Config Routes
router.get('/config', configController.getConfig);
router.post('/config', authMiddleware, configController.updateConfig.bind(configController));
router.put('/config', authMiddleware, configController.replaceConfig.bind(configController));

// Token Routes. Public: this is how a browser gets its conference token
router.post('/generate-token', tokenController.generateToken.bind(tokenController));

// Room Routes. The user list stays public: the lobby shows who is in the room before joining
router.get('/room/:roomId/users', roomController.getUsers.bind(roomController));
router.get(
  '/room/:roomId/user/:userId/isJoined',
  inRoom('roomId'),
  roomController.checkUserJoined.bind(roomController),
);

// External Stream Routes
router.get(
  '/external-streams',
  requireConferenceToken(),
  roomController.getExternalStreams.bind(roomController),
);
router.post(
  '/room/:roomName/external-stream/:streamId',
  inRoom('roomName'),
  roomController.addExternalStream.bind(roomController),
);
router.delete(
  '/room/:roomName/external-stream/:streamId',
  inRoom('roomName'),
  roomController.removeExternalStream.bind(roomController),
);

// Recording Routes
router.post(
  '/room/:roomName/startRecording',
  inRoom('roomName'),
  roomController.startRecording.bind(roomController),
);
router.post(
  '/room/:roomName/stopRecording',
  inRoom('roomName'),
  roomController.stopRecording.bind(roomController),
);
// The browser's local recording, stored in S3 with the keys kept on this service
router.post(
  '/room/:roomName/local-recording',
  inRoom('roomName'),
  recordingUploadController.uploadLocalRecording.bind(recordingUploadController),
);

// User Moderation Routes
router.post(
  '/room/:roomName/user/:userId/block',
  hostOf('roomName'),
  roomController.blockUser.bind(roomController),
);
router.post(
  '/room/:roomName/user/:userId/unblock',
  hostOf('roomName'),
  roomController.unblockUser.bind(roomController),
);

// Transcription Routes
router.get(
  '/room/:roomName/transcriptions',
  inRoom('roomName'),
  roomController.getTranscriptions.bind(roomController),
);
router.post(
  '/room/:roomName/user/:userId/start-transcription',
  inRoom('roomName'),
  roomController.startTranscription.bind(roomController),
);
router.post(
  '/room/:roomName/user/:userId/stop-transcription',
  inRoom('roomName'),
  roomController.stopTranscription.bind(roomController),
);

// Health/Utils Routes. Public: checked before joining
router.get(
  '/check-node-group-availability',
  healthController.checkNodeGroupAvailability.bind(healthController),
);
router.get('/health-check', healthController.check.bind(healthController));

export default router;
