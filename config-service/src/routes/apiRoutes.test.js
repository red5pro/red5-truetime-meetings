import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import red5Service from '../services/red5Service.js';
import apiRoutes from './apiRoutes.js';

// Which endpoints need a conference token. The handlers behind them are tested elsewhere.

const PROTECTED = [
  ['get', '/api/room/team-sync/user/Alex_1/isJoined'],
  ['get', '/api/external-streams'],
  ['post', '/api/room/team-sync/external-stream/cam-1'],
  ['delete', '/api/room/team-sync/external-stream/cam-1'],
  ['post', '/api/room/team-sync/startRecording'],
  ['post', '/api/room/team-sync/stopRecording'],
  ['post', '/api/room/team-sync/local-recording'],
  ['post', '/api/room/team-sync/user/Alex_1/block'],
  ['post', '/api/room/team-sync/user/Alex_1/unblock'],
  ['get', '/api/room/team-sync/transcriptions'],
  ['post', '/api/room/team-sync/user/Alex_1/start-transcription'],
  ['post', '/api/room/team-sync/user/Alex_1/stop-transcription'],
];

// Needed before a browser has a token (the lobby, joining, health checks)
const PUBLIC = [
  ['get', '/api/config'],
  ['post', '/api/generate-token'],
  ['get', '/api/room/team-sync/users'],
  ['get', '/api/check-node-group-availability'],
  ['get', '/api/health-check'],
];

let server;
let base;

beforeAll(async () => {
  // Every Red5 call fails, so a public route answers without reaching Red5
  vi.spyOn(red5Service, 'getClient').mockRejectedValue(
    new Error('Master key or secret not configured'),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});

  const app = express();
  app.use(express.json());
  app.use('/api', apiRoutes);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => {
  server.close();
  vi.restoreAllMocks();
});

const call = (method, path) =>
  fetch(`${base}${path}`, {
    method: method.toUpperCase(),
    headers: { 'Content-Type': 'application/json' },
    body: method === 'get' ? undefined : '{}',
  });

describe('api routes', () => {
  it.each(PROTECTED)('%s %s needs a conference token', async (method, path) => {
    const response = await call(method, path);

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe('A conference token is required');
  });

  it.each(PUBLIC)('%s %s works without one', async (method, path) => {
    const response = await call(method, path);
    const body = await response.json().catch(() => ({}));

    // It may still fail for other reasons (Red5 is unavailable here), but not for want of a token.
    // generate-token answers 401 itself when the master credentials are missing.
    expect(body.error ?? '').not.toMatch(/conference token|for another room|for this role/i);
  });
});
