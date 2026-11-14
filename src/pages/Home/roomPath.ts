/**
 * The room to open from what was typed: a room name, or a meeting link someone shared (its last
 * path segment is the room; a `token` in it is kept). Empty when there's nothing usable.
 */
export function roomPathFromInput(input: string): string {
  const value = input.trim();
  if (!value) return '';

  const looksLikeLink = /^https?:\/\//i.test(value) || /^[^\s/]+\.[^\s/]+\/./.test(value);
  if (looksLikeLink) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      const room = url.pathname.split('/').filter(Boolean).pop();
      if (!room) return '';
      const token = url.searchParams.get('token');
      return `/${encodeURIComponent(decodeURIComponent(room))}${
        token ? `?token=${encodeURIComponent(token)}` : ''
      }`;
    } catch {
      // Not a link after all; treat it as a room name
    }
  }
  return `/${encodeURIComponent(value)}`;
}
