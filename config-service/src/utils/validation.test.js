import { describe, expect, it } from 'vitest';
import { applyDefaultTheme, resolveTheme, validateConfig, validThemes } from './validation.js';

describe('VITE_DEFAULT_THEME validation', () => {
  it.each(['black', 'blue', 'purple', 'emerald', 'aurora', 'sunset', 'ocean', 'broadcast'])(
    'accepts %s',
    (theme) => {
      expect(validateConfig({ VITE_DEFAULT_THEME: theme })).toEqual([]);
    },
  );

  it.each(['default', 'dark', 'Black', ''])('rejects %j and lists the valid themes', (theme) => {
    expect(validateConfig({ VITE_DEFAULT_THEME: theme })).toEqual([
      `VITE_DEFAULT_THEME must be one of: ${validThemes.join(', ')}`,
    ]);
  });
});

describe('resolveTheme', () => {
  it.each(['black', 'purple', 'broadcast'])('keeps %s', (theme) => {
    expect(resolveTheme(theme)).toBe(theme);
  });

  it.each(['default', 'dark', '', undefined])('falls back to black for %j', (theme) => {
    expect(resolveTheme(theme)).toBe('black');
  });
});

describe('applyDefaultTheme', () => {
  it('turns default into black', () => {
    const config = { VITE_DEFAULT_THEME: 'default' };
    applyDefaultTheme(config);
    expect(config.VITE_DEFAULT_THEME).toBe('black');
  });

  it.each(['purple', 'dark'])('leaves %s unchanged', (theme) => {
    const config = { VITE_DEFAULT_THEME: theme };
    applyDefaultTheme(config);
    expect(config.VITE_DEFAULT_THEME).toBe(theme);
  });

  it('does not add a theme to a partial update', () => {
    const config = { VITE_HOST: 'example.com' };
    applyDefaultTheme(config);
    expect(config).toEqual({ VITE_HOST: 'example.com' });
  });
});
