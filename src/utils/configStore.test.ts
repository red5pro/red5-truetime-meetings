import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load() {
  return import('./configStore');
}

describe('getRuntimeConfig', () => {
  it('lets values set in .env win over the config service in development', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_BASENAME', '/');
    vi.stubEnv('VITE_TURN_SERVER_USERNAME', '');
    const { setRuntimeConfig, getRuntimeConfig } = await load();
    setRuntimeConfig({
      VITE_BASENAME: '/meetings',
      VITE_TURN_SERVER_USERNAME: 'from-server',
      VITE_TEST_SERVER_ONLY: 'server-value',
    });
    const config = getRuntimeConfig();
    expect(config.VITE_BASENAME).toBe('/');
    // Empty local values don't blank out the service's
    expect(config.VITE_TURN_SERVER_USERNAME).toBe('from-server');
    // Unset locally: the service's value
    expect(config.VITE_TEST_SERVER_ONLY).toBe('server-value');
  });

  it('keeps the config service first in production builds', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_BASENAME', '/');
    const { setRuntimeConfig, getRuntimeConfig } = await load();
    setRuntimeConfig({ VITE_BASENAME: '/meetings' });
    expect(getRuntimeConfig().VITE_BASENAME).toBe('/meetings');
  });
});
