import { themeNames, type ThemeName } from 'truetime-ui';
import { readString, writeStored } from './appStorage';

/** Field in the app's storage (`ttm`) holding the theme the user picked in the options menu. */
export const SELECTED_THEME_FIELD = 'selectedTheme';

/** Returns the saved theme if it names a known theme, otherwise null. */
export function getSavedTheme(): ThemeName | null {
  const value = readString(SELECTED_THEME_FIELD);
  return value && (themeNames as string[]).includes(value) ? (value as ThemeName) : null;
}

/** Remembers the user's theme choice across reloads (for this visit only if storage is blocked). */
export function saveTheme(theme: string): void {
  writeStored(SELECTED_THEME_FIELD, theme);
}
