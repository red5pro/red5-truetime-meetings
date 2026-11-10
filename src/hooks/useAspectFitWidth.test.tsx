import { act, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useAspectFitWidth } from './useAspectFitWidth.ts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let resizeCallback: (() => void) | null = null;
class FakeResizeObserver {
  constructor(callback: () => void) {
    resizeCallback = callback;
  }
  observe(): void {}
  disconnect(): void {}
}

const size = { width: 0, height: 0 };

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useAspectFitWidth(ref, 16 / 9);
  return (
    <div ref={ref} data-testid="area">
      {width ?? 'none'}
    </div>
  );
}

describe('useAspectFitWidth', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => size.width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => size.height);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('is limited by height in a wide, short area', () => {
    size.width = 1200;
    size.height = 360;
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe('640');
  });

  test('is limited by width in a narrow, tall area and follows resizes', () => {
    size.width = 400;
    size.height = 800;
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe('400');

    size.width = 1600;
    size.height = 450;
    act(() => resizeCallback?.());
    expect(container.textContent).toBe('800');
  });

  test('waits for a measurable size', () => {
    size.width = 0;
    size.height = 0;
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe('none');
  });
});
