import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import red5Service from '../services/red5Service.js';
import { requireConferenceToken } from './conferenceTokenMiddleware.js';

const SECRET = 'conference-secret';

const tokenFor = ({ roomId = 'team-sync', role = 'publisher', secret = SECRET, ...rest } = {}) =>
  jwt.sign({ roomId, uid: 'Alex_abc123', role, ...rest }, secret, { algorithm: 'HS256' });

const request = (token, params = { roomName: 'team-sync' }) => ({
  params,
  headers: token ? { authorization: `Bearer ${token}` } : {},
});

const respond = () => {
  const res = { statusCode: undefined, body: undefined };
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

const run = async (middleware, req) => {
  const res = respond();
  const next = vi.fn();
  await middleware(req, res, next);
  return { res, next };
};

describe('requireConferenceToken', () => {
  beforeEach(() => {
    vi.spyOn(red5Service, 'getClient').mockResolvedValue({
      getCredentials: () => ({ conferenceSecret: SECRET }),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('lets a valid token for the room through and keeps its claims', async () => {
    const req = request(tokenFor());
    const { res, next } = await run(requireConferenceToken({ roomParam: 'roomName' }), req);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeUndefined();
    expect(req.conference).toMatchObject({ roomId: 'team-sync', uid: 'Alex_abc123' });
  });

  it('turns away a request without a token', async () => {
    const { res, next } = await run(requireConferenceToken(), request());

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('turns away a token signed with another secret', async () => {
    const { res, next } = await run(
      requireConferenceToken(),
      request(tokenFor({ secret: 'someone-else' })),
    );

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('turns away an expired token', async () => {
    const expired = tokenFor({ exp: Math.floor(Date.now() / 1000) - 60 });
    const { res, next } = await run(requireConferenceToken(), request(expired));

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('turns away a token that is not HS256', async () => {
    const unsigned = jwt.sign({ roomId: 'team-sync' }, null, { algorithm: 'none' });
    const { res, next } = await run(requireConferenceToken(), request(unsigned));

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('turns away a token for another room', async () => {
    const { res, next } = await run(
      requireConferenceToken({ roomParam: 'roomName' }),
      request(tokenFor({ roomId: 'another-room' })),
    );

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a token for any room when the route has no room', async () => {
    const { next } = await run(
      requireConferenceToken(),
      request(tokenFor({ roomId: 'another-room' }), {}),
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('checks the role when the route limits it', async () => {
    const hostOnly = requireConferenceToken({ roomParam: 'roomName', roles: ['admin'] });

    const publisher = await run(hostOnly, request(tokenFor({ role: 'publisher' })));
    const host = await run(hostOnly, request(tokenFor({ role: 'admin' })));

    expect(publisher.res.statusCode).toBe(403);
    expect(publisher.next).not.toHaveBeenCalled();
    expect(host.next).toHaveBeenCalledOnce();
  });

  it('says it cannot check tokens when the master credentials are missing', async () => {
    red5Service.getClient.mockRejectedValue(new Error('Master key or secret not configured'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { res, next } = await run(requireConferenceToken(), request(tokenFor()));

    expect(res.statusCode).toBe(503);
    expect(next).not.toHaveBeenCalled();
  });
});
