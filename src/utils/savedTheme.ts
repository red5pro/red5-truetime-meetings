import { themeNames, type ThemeName } from 'truetime-ui';

/** localStorage key holding the theme the user picked in the options menu. */
export const SELECTED_THEME_KEY = 'selectedTheme';

/** Returns the saved theme if it names a known theme, otherwise null. */
export function getSavedTheme(): ThemeName | null {
  let value: string | null = null;
  try {
    value = localStorage.getItem(SELECTED_THEME_KEY);
  } catch {
    return null;
  }
  return value && (themeNames as string[]).includes(value) ? (value as ThemeName) : null;
}

/** Remembers the user's theme choice across reloads. */
export function saveTheme(theme: string): void {
  try {
    localStorage.setItem(SELECTED_THEME_KEY, theme);
  } catch {
    // Storage unavailable (private mode, blocked site data): the choice lasts this session only.
  }
}
