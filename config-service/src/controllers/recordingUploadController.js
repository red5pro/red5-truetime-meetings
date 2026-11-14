import { Transform } from 'node:stream';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import configService from '../services/configService.js';

// Largest local recording the service accepts, in MB
const DEFAULT_MAX_MB = 2048;

export const maxUploadBytes = () => {
  const mb = Number(process.env.MEETINGS_MAX_RECORDING_UPLOAD_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_MAX_MB) * 1024 * 1024;
};

/** Room and user names as they may appear in an S3 key */
const keyPart = (value) =>
  String(value ?? '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 100) || 'unknown';

class TooLargeError extends Error {}

/** Passes the body through and fails once it grows past `limit` bytes */
const sizeLimit = (limit) => {
  let received = 0;
  return new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      if (received > limit) {
        callback(new TooLargeError(`Recording is larger than ${limit} bytes`));
      } else {
        callback(null, chunk);
      }
    },
  });
};

/**
 * Receives a local recording (a zip) from the browser and stores it in S3 with the credentials
 * kept here, so the AWS keys never reach the browser. The route requires a conference token for
 * the room (see apiRoutes.js).
 */
class RecordingUploadController {
  /** The S3 upload; a seam for tests */
  createUpload(config, params) {
    const client = new S3Client({
      region: config.VITE_AWS_BUCKET_LOCATION || 'us-east-1',
      credentials: {
        accessKeyId: config.VITE_AWS_ACCESS_KEY,
        secretAccessKey: config.VITE_AWS_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return new Upload({ client, params, leavePartsOnError: false });
  }

  /** Runs after requireConferenceToken({ roomParam: 'roomName' }), which sets req.conference */
  async uploadLocalRecording(req, res) {
    const { roomName } = req.params;
    const claims = req.conference;

    let config;
    try {
      config = await configService.read();
    } catch {
      return res.status(500).json({ error: 'Failed to read configuration' });
    }
    if (
      !config.VITE_AWS_ACCESS_KEY ||
      !config.VITE_AWS_SECRET_ACCESS_KEY ||
      !config.VITE_AWS_BUCKET_NAME
    ) {
      return res.status(503).json({ error: 'Recording uploads are not set up' });
    }

    const limit = maxUploadBytes();
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > limit) {
      return res.status(413).json({ error: 'Recording is too large' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `recordings/live/streams/localrecording_${keyPart(roomName)}_${timestamp}_${keyPart(claims.uid)}.zip`;

    const body = req.pipe(sizeLimit(limit));
    try {
      await this.createUpload(config, {
        Bucket: config.VITE_AWS_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: 'application/zip',
      }).done();
    } catch (error) {
      if (error instanceof TooLargeError || body.errored instanceof TooLargeError) {
        return res.status(413).json({ error: 'Recording is too large' });
      }
      console.error('Failed to upload local recording:', error);
      return res.status(502).json({ error: 'Failed to upload the recording' });
    }

    console.log(`Local recording uploaded: ${key}`);
    res.json({ success: true, key });
  }
}

export default new RecordingUploadController();
