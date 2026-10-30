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
