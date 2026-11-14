import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useNoiseSuppression, type UseNoiseSuppressionReturn } from './useNoiseSuppression';
import {
  getNoiseSuppressionLevel,
  getNoiseSuppressionPercent,
  noiseSuppressionPercentToLevel,
  saveNoiseSuppressionPercent,
} from '../utils/conferenceConfig';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(() => localStorage.clear());
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

describe('noise suppression level', () => {
  it('turns a share of noise removed into the dB limit the model takes', () => {
    expect(noiseSuppressionPercentToLevel(0)).toBe(0);
    expect(noiseSuppressionPercentToLevel(5)).toBe(1); // never rounds down to 0 (off)
    expect(noiseSuppressionPercentToLevel(90)).toBe(20);
    expect(noiseSuppressionPercentToLevel(100)).toBe(100);
  });

  it('uses the saved percentage over the default', () => {
    const fallback = getNoiseSuppressionPercent();
    saveNoiseSuppressionPercent(90);
    expect(getNoiseSuppressionPercent()).toBe(90);
    expect(getNoiseSuppressionLevel()).toBe(20);
    saveNoiseSuppressionPercent(250);
    expect(getNoiseSuppressionPercent()).toBe(100);
    localStorage.clear();
    expect(getNoiseSuppressionPercent()).toBe(fallback);
  });
});

describe('useNoiseSuppression', () => {
  function renderHook() {
    const setNoiseSuppressionLevel = vi.fn();
    const client = { current: { mediaStreamManager: { setNoiseSuppressionLevel } } };
    const result: { current: UseNoiseSuppressionReturn | null } = { current: null };
    function Probe() {
      result.current = useNoiseSuppression(client);
      return null;
    }
    container = document.createElement('div');
    root = createRoot(container);
    act(() => root!.render(<Probe />));
    return { result, setNoiseSuppressionLevel };
  }

  it('applies and remembers a new level while it is on', () => {
    const { result, setNoiseSuppressionLevel } = renderHook();
    act(() => result.current!.setNoiseSuppressionPercent(90));
    expect(setNoiseSuppressionLevel).toHaveBeenLastCalledWith(20);
    expect(result.current!.noiseSuppressionPercent).toBe(90);
    expect(localStorage.getItem('noiseSuppressionPercent')).toBe('90');
  });

  it('keeps it off when the level changes, and uses the new level when turned back on', () => {
    const { result, setNoiseSuppressionLevel } = renderHook();
    act(() => result.current!.toggleNoiseSuppression(false));
    expect(setNoiseSuppressionLevel).toHaveBeenLastCalledWith(0);
    setNoiseSuppressionLevel.mockClear();
    act(() => result.current!.setNoiseSuppressionPercent(90));
    expect(setNoiseSuppressionLevel).not.toHaveBeenCalled();
    act(() => result.current!.toggleNoiseSuppression(true));
    expect(setNoiseSuppressionLevel).toHaveBeenLastCalledWith(20);
  });
});
