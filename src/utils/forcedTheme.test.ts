import { afterEach, describe, expect, it } from 'vitest';
import { themeNames } from 'truetime-ui';
import { FORCED_THEME_KEY, getForcedTheme } from './forcedTheme';

describe('getForcedTheme', () => {
  afterEach(() => localStorage.clear());

  it('returns null when the key is not set', () => {
    expect(getForcedTheme()).toBeNull();
  });

  it('returns a valid theme name', () => {
    localStorage.setItem(FORCED_THEME_KEY, themeNames[1]);
    expect(getForcedTheme()).toBe(themeNames[1]);
  });

  it('ignores case and surrounding whitespace', () => {
    localStorage.setItem(FORCED_THEME_KEY, `  ${themeNames[1].toUpperCase()} `);
    expect(getForcedTheme()).toBe(themeNames[1]);
  });

  it('returns null for an unknown theme', () => {
    localStorage.setItem(FORCED_THEME_KEY, 'not-a-theme');
    expect(getForcedTheme()).toBeNull();
  });
});
