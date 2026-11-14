import { afterEach, describe, expect, it } from 'vitest';
import { themeNames } from 'truetime-ui';
import { readString, writeStored } from './appStorage';
import { SELECTED_THEME_FIELD, getSavedTheme, saveTheme } from './savedTheme';

describe('savedTheme', () => {
  afterEach(() => localStorage.clear());

  it('returns null when nothing is saved', () => {
    expect(getSavedTheme()).toBeNull();
  });

  it('returns a theme saved with saveTheme', () => {
    saveTheme(themeNames[1]);
    expect(readString(SELECTED_THEME_FIELD)).toBe(themeNames[1]);
    expect(getSavedTheme()).toBe(themeNames[1]);
  });

  it('returns null for an unknown theme', () => {
    writeStored(SELECTED_THEME_FIELD, 'not-a-theme');
    expect(getSavedTheme()).toBeNull();
  });
});
