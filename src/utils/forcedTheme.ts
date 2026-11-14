import { themeNames, type ThemeName } from 'truetime-ui';

/**
 * localStorage key for a per-user theme override. It is never written by the app;
 * set it by hand (e.g. in DevTools: `localStorage.setItem('forced_theme', 'blue')`).
 */
export const FORCED_THEME_KEY = 'forced_theme';

/** Returns the theme stored under `forced_theme` if it names a known theme, otherwise null. */
export function getForcedTheme(): ThemeName | null {
  let value: string | null = null;
  try {
    value = localStorage.getItem(FORCED_THEME_KEY);
  } catch {
    return null;
  }
  const name = value?.trim().toLowerCase();
  return name && (themeNames as string[]).includes(name) ? (name as ThemeName) : null;
}
