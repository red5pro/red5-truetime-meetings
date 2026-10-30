import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('default theme fallback', () => {
  let dir;
  let file;
  let configService;
  let controller;

  const stored = async () => JSON.parse(await fs.readFile(file, 'utf8'));

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-service-'));
    file = path.join(dir, 'config.json');
    vi.stubEnv('CONFIG_FILE', file);
    vi.resetModules();
    configService = (await import('../services/configService.js')).default;
    controller = (await import('./configController.js')).default;
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it.each([['default'], ['dark'], [undefined]])(
    'creates the first config with black when the environment says %j',
    async (theme) => {
      vi.stubEnv('VITE_DEFAULT_THEME', theme);
      await configService.initialize();
      expect((await stored()).VITE_DEFAULT_THEME).toBe('black');
    },
  );

  it('keeps a valid theme from the environment', async () => {
    vi.stubEnv('VITE_DEFAULT_THEME', 'purple');
    await configService.initialize();
    expect((await stored()).VITE_DEFAULT_THEME).toBe('purple');
  });

  it('reads a stored default as black', async () => {
    await fs.writeFile(
      file,
      JSON.stringify({ VITE_DEFAULT_THEME: 'default', VITE_HOST: 'a.test' }),
    );
    expect(await configService.read()).toEqual({
      VITE_DEFAULT_THEME: 'black',
      VITE_HOST: 'a.test',
    });
  });

  it('keeps a stored valid theme', async () => {
    await fs.writeFile(file, JSON.stringify({ VITE_DEFAULT_THEME: 'ocean' }));
    expect((await configService.read()).VITE_DEFAULT_THEME).toBe('ocean');
  });

  it.each(['updateConfig', 'replaceConfig'])('%s saves default as black', async (method) => {
    await fs.writeFile(file, JSON.stringify({ VITE_DEFAULT_THEME: 'ocean' }));
    const res = respond();
    await controller[method]({ body: { VITE_DEFAULT_THEME: 'default' } }, res);
    expect(res.statusCode).toBe(200);
    expect((await stored()).VITE_DEFAULT_THEME).toBe('black');
  });

  it.each(['updateConfig', 'replaceConfig'])(
    '%s still rejects an unknown theme',
    async (method) => {
      await fs.writeFile(file, JSON.stringify({ VITE_DEFAULT_THEME: 'ocean' }));
      const res = respond();
      await controller[method]({ body: { VITE_DEFAULT_THEME: 'dark' } }, res);
      expect(res.statusCode).toBe(400);
      expect((await stored()).VITE_DEFAULT_THEME).toBe('ocean');
    },
  );
});

describe('masked fields', () => {
  let dir;
  let file;
  let controller;

  const stored = async () => JSON.parse(await fs.readFile(file, 'utf8'));
  const SECRETS = {
    VITE_PUBNUB_PUBLISH_KEY: 'real-pub',
    VITE_PUBNUB_SUBSCRIBE_KEY: 'real-sub',
    VITE_AWS_ACCESS_KEY: 'real-access',
    VITE_AWS_SECRET_ACCESS_KEY: 'real-secret',
  };
  const MASKED = Object.fromEntries(Object.keys(SECRETS).map((key) => [key, '***']));

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-service-'));
    file = path.join(dir, 'config.json');
    vi.stubEnv('CONFIG_FILE', file);
    vi.resetModules();
    controller = (await import('./configController.js')).default;
    await fs.writeFile(
      file,
      JSON.stringify({
        ...SECRETS,
        VITE_GOOGLE_CLIENT_ID: 'client-id',
        VITE_AWS_BUCKET_NAME: 'bucket',
        VITE_AWS_BUCKET_LOCATION: 'us-east-1',
        VITE_DEFAULT_THEME: 'ocean',
      }),
    );
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('masks only the four secrets on read', async () => {
    const res = respond();
    await controller.getConfig({}, res);
    expect(res.body).toMatchObject({
      ...MASKED,
      VITE_GOOGLE_CLIENT_ID: 'client-id',
      VITE_AWS_BUCKET_NAME: 'bucket',
      VITE_AWS_BUCKET_LOCATION: 'us-east-1',
    });
  });

  it('leaves an empty secret empty on read', async () => {
    await fs.writeFile(file, JSON.stringify({ VITE_PUBNUB_PUBLISH_KEY: '' }));
    const res = respond();
    await controller.getConfig({}, res);
    expect(res.body.VITE_PUBNUB_PUBLISH_KEY).toBe('');
  });

  it.each(['updateConfig', 'replaceConfig'])('%s keeps stored secrets sent as ***', async (m) => {
    const res = respond();
    await controller[m]({ body: { ...MASKED, VITE_DEFAULT_THEME: 'blue' } }, res);
    expect(res.statusCode).toBe(200);
    expect(await stored()).toMatchObject({ ...SECRETS, VITE_DEFAULT_THEME: 'blue' });
    expect(res.body.config).toMatchObject(MASKED);
  });

  it.each(['updateConfig', 'replaceConfig'])('%s replaces a secret and masks it', async (m) => {
    const res = respond();
    await controller[m]({ body: { ...MASKED, VITE_AWS_ACCESS_KEY: 'new-access' } }, res);
    expect((await stored()).VITE_AWS_ACCESS_KEY).toBe('new-access');
    expect(res.body.config.VITE_AWS_ACCESS_KEY).toBe('***');
  });

  it('clears a secret sent as an empty string', async () => {
    const res = respond();
    await controller.updateConfig({ body: { VITE_PUBNUB_SUBSCRIBE_KEY: '' } }, res);
    expect((await stored()).VITE_PUBNUB_SUBSCRIBE_KEY).toBe('');
    expect((await stored()).VITE_PUBNUB_PUBLISH_KEY).toBe('real-pub');
  });

  it('does not store the mask when there is nothing to keep', async () => {
    await fs.writeFile(file, JSON.stringify({ VITE_DEFAULT_THEME: 'ocean' }));
    const res = respond();
    await controller.updateConfig({ body: { VITE_AWS_ACCESS_KEY: '***' } }, res);
    expect(await stored()).not.toHaveProperty('VITE_AWS_ACCESS_KEY');
  });

  it('rejects a non-boolean VITE_ENABLE_GOOGLE_AUTH', async () => {
    const res = respond();
    await controller.updateConfig({ body: { VITE_ENABLE_GOOGLE_AUTH: 'yes' } }, res);
    expect(res.statusCode).toBe(400);
  });
});
