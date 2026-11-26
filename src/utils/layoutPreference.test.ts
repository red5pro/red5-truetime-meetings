import { afterEach, describe, expect, it } from 'vitest';
import { writeStored } from './appStorage';
import { getLayoutPreference, saveLayoutPreference } from './conferenceConfig';
import { LayoutOptions } from './layoutOptions';

afterEach(() => {
  localStorage.clear();
});

describe('getLayoutPreference', () => {
  it('defaults to Tiled when no layout was saved', () => {
    expect(getLayoutPreference()).toBe(LayoutOptions.Tiled);
  });

  it('returns the saved layout', () => {
    saveLayoutPreference(LayoutOptions.Tiled);
    expect(getLayoutPreference()).toBe(LayoutOptions.Tiled);
  });

  it('falls back to Tiled for an unknown saved value', () => {
    writeStored('layout', 'Auto');
    expect(getLayoutPreference()).toBe(LayoutOptions.Tiled);
  });
});
