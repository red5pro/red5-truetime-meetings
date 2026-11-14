import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEY,
  readBoolean,
  readNumber,
  readString,
  removeStored,
  writeStored,
} from './appStorage';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('appStorage', () => {
  it('keeps every field under the single ttm key', () => {
    writeStored('theme', 'ocean');
    writeStored('pushToTalk', true);
    writeStored('desiredTileCount', 12);
    expect(localStorage.length).toBe(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      theme: 'ocean',
      pushToTalk: true,
      desiredTileCount: 12,
    });
    expect(readString('theme')).toBe('ocean');
    expect(readBoolean('pushToTalk')).toBe(true);
    expect(readNumber('desiredTileCount')).toBe(12);
  });

  it('removes the key once the last field is gone', () => {
    writeStored('theme', 'ocean');
    removeStored('theme');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('keeps session fields in sessionStorage under the same key', () => {
    writeStored('draft', 'hi', 'session');
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('{"draft":"hi"}');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores values of the wrong type and unreadable data', () => {
    writeStored('desiredTileCount', 'twelve');
    expect(readNumber('desiredTileCount')).toBeUndefined();
    localStorage.setItem(STORAGE_KEY, 'not json');
    expect(readString('theme')).toBeUndefined();
  });

  it('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeStored('theme', 'ocean')).not.toThrow();
    expect(readString('theme')).toBeUndefined();
  });
});
