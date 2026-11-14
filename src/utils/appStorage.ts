/**
 * Everything Meetings keeps in the browser lives under one key, `ttm`, holding a JSON object of
 * named fields. Use these helpers instead of calling localStorage / sessionStorage directly, so the
 * app never scatters its own keys. (Third-party SDKs such as Red5 Pro and PubNub still write
 * theirs.)
 *
 * Storage can be unavailable (private mode, blocked site data): reads then return undefined and
 * writes are dropped, so a preference lasts for this visit only.
 */

export const STORAGE_KEY = 'ttm';

/** `local` survives restarts and is shared by every tab; `session` is per tab. */
export type StorageArea = 'local' | 'session';

type Fields = Record<string, unknown>;

function storageFor(area: StorageArea): Storage {
  return area === 'local' ? window.localStorage : window.sessionStorage;
}

function load(area: StorageArea): Fields {
  try {
    const raw = storageFor(area).getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Fields) : {};
  } catch {
    return {};
  }
}

function save(area: StorageArea, fields: Fields): void {
  try {
    if (Object.keys(fields).length === 0) storageFor(area).removeItem(STORAGE_KEY);
    else storageFor(area).setItem(STORAGE_KEY, JSON.stringify(fields));
  } catch {
    // Storage unavailable: not remembered
  }
}

/** The stored value of `field`, or undefined when nothing is stored. */
export function readStored(field: string, area: StorageArea = 'local'): unknown {
  return load(area)[field];
}

export function readString(field: string, area: StorageArea = 'local'): string | undefined {
  const value = readStored(field, area);
  return typeof value === 'string' ? value : undefined;
}

export function readBoolean(field: string, area: StorageArea = 'local'): boolean | undefined {
  const value = readStored(field, area);
  return typeof value === 'boolean' ? value : undefined;
}

export function readNumber(field: string, area: StorageArea = 'local'): number | undefined {
  const value = readStored(field, area);
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Stores `value` (anything JSON can hold) as `field`; undefined removes the field. */
export function writeStored(field: string, value: unknown, area: StorageArea = 'local'): void {
  const fields = load(area);
  if (value === undefined) delete fields[field];
  else fields[field] = value;
  save(area, fields);
}

export function removeStored(field: string, area: StorageArea = 'local'): void {
  writeStored(field, undefined, area);
}
