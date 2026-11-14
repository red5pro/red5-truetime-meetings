import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider, themeNames } from 'truetime-ui';
import { devMenuItems } from './devMenuItems';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

function render(currentTheme: string, onThemeChange = vi.fn()) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <ul>{devMenuItems({ currentTheme, onThemeChange })}</ul>
      </TrueTimeThemeProvider>,
    ),
  );
  return onThemeChange;
}

const switcher = () => container.querySelector<HTMLElement>('#dev-theme-switcher')!;

describe('devMenuItems', () => {
  it('comes after the fake participant items and shows the current theme', () => {
    render('aurora');
    const ids = Array.from(container.querySelectorAll('li[id]')).map((item) => item.id);
    expect(ids).toEqual(['add-fake-participant', 'remove-fake-participant', 'dev-theme-switcher']);
    expect(switcher().textContent).toContain('Theme: aurora');
  });

  it('steps to the next theme and wraps round', () => {
    const onThemeChange = render(themeNames[0]);
    act(() => switcher().click());
    expect(onThemeChange).toHaveBeenCalledWith(themeNames[1]);

    act(() => root!.unmount());
    container.remove();
    const last = render(themeNames[themeNames.length - 1]);
    act(() => switcher().click());
    expect(last).toHaveBeenCalledWith(themeNames[0]);
  });
});
