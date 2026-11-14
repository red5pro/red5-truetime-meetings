import { afterEach, describe, expect, it } from 'vitest';
import { themeNames } from 'truetime-ui';
import { SELECTED_THEME_KEY, getSavedTheme, saveTheme } from './savedTheme';

describe('savedTheme', () => {
  afterEach(() => localStorage.clear());

  it('returns null when nothing is saved', () => {
    expect(getSavedTheme()).toBeNull();
  });

  it('returns a theme saved with saveTheme', () => {
    saveTheme(themeNames[1]);
    expect(localStorage.getItem(SELECTED_THEME_KEY)).toBe(themeNames[1]);
    expect(getSavedTheme()).toBe(themeNames[1]);
  });

  it('returns null for an unknown theme', () => {
    localStorage.setItem(SELECTED_THEME_KEY, 'not-a-theme');
    expect(getSavedTheme()).toBeNull();
  });
});
