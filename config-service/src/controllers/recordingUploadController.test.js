import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import configService from '../services/configService.js';
import controller from './recordingUploadController.js';

// The route's token check (conferenceTokenMiddleware) is tested on its own; here the request
// arrives with the claims it sets.

const S3_CONFIG = {
  VITE_AWS_ACCESS_KEY: 'AKIA-test',
  VITE_AWS_SECRET_ACCESS_KEY: 'secret-test',
  VITE_AWS_BUCKET_NAME: 'recordings-bucket',
  VITE_AWS_BUCKET_LOCATION: 'eu-west-1',
};

const request = ({
  room = 'team-sync',
  uid = 'Alex_abc123',
  body = 'zip-bytes',
  headers = {},
} = {}) => {
  const req = Readable.from([Buffer.from(body)]);
  req.params = { roomName: room };
  req.headers = headers;
  req.conference = { roomId: room, uid, role: 'publisher' };
  return req;
};

const respond = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

/** An upload that reads the whole body, like the real one */
const fakeUpload = () => {
  const calls = [];
  vi.spyOn(controller, 'createUpload').mockImplementation((config, params) => {
    const call = { config, params, received: '' };
    calls.push(call);
    return {
      done: async () => {
        for await (const chunk of params.Body) call.received += chunk.toString();
      },
    };
  });
  return calls;
};

describe('local recording upload', () => {
  beforeEach(() => {
    vi.spyOn(configService, 'read').mockResolvedValue({ ...S3_CONFIG });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('stores the recording in the bucket with the keys kept on the service', async () => {
    const calls = fakeUpload();
    const res = respond();

    await controller.uploadLocalRecording(request(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].config.VITE_AWS_SECRET_ACCESS_KEY).toBe('secret-test');
    expect(calls[0].params.Bucket).toBe('recordings-bucket');
    expect(calls[0].params.ContentType).toBe('application/zip');
    expect(calls[0].params.Key).toMatch(
      /^recordings\/live\/streams\/localrecording_team-sync_.+_Alex_abc123\.zip$/,
    );
    expect(res.body.key).toBe(calls[0].params.Key);
    expect(calls[0].received).toBe('zip-bytes');
  });

  it('keeps room and user names from shaping the key', async () => {
    const calls = fakeUpload();

    await controller.uploadLocalRecording(
      request({ room: '../../etc passwd', uid: '../x' }),
      respond(),
    );

    expect(calls[0].params.Key).toMatch(
      /^recordings\/live\/streams\/localrecording_______etc_passwd_.+___x\.zip$/,
    );
  });

  it('says uploads are not set up when the bucket settings are missing', async () => {
    configService.read.mockResolvedValue({ VITE_AWS_BUCKET_NAME: 'recordings-bucket' });
    const calls = fakeUpload();
    const res = respond();

    await controller.uploadLocalRecording(request(), res);

    expect(res.statusCode).toBe(503);
    expect(calls).toHaveLength(0);
  });

  it('refuses a declared size over the limit before uploading', async () => {
    vi.stubEnv('MEETINGS_MAX_RECORDING_UPLOAD_MB', '1');
    const calls = fakeUpload();
    const res = respond();

    await controller.uploadLocalRecording(
      request({ headers: { 'content-length': String(2 * 1024 * 1024) } }),
      res,
    );

    expect(res.statusCode).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it('stops a body that grows past the limit without a declared size', async () => {
    vi.stubEnv('MEETINGS_MAX_RECORDING_UPLOAD_MB', '1');
    fakeUpload();
    const res = respond();

    await controller.uploadLocalRecording(request({ body: 'x'.repeat(1024 * 1024 + 1) }), res);

    expect(res.statusCode).toBe(413);
  });

  it('reports a failed upload to S3', async () => {
    vi.spyOn(controller, 'createUpload').mockReturnValue({
      done: () => Promise.reject(new Error('AccessDenied')),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = respond();

    await controller.uploadLocalRecording(request(), res);

    expect(res.statusCode).toBe(502);
  });
});
