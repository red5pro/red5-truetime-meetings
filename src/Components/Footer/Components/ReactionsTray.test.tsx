import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import { REACTIONS, ReactionsTray } from './ReactionsTray';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

describe('ReactionsTray', () => {
  it('names each emoji and sends its key', () => {
    const onSend = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() =>
      root!.render(
        <TrueTimeThemeProvider>
          <ReactionsTray onSend={onSend} />
        </TrueTimeThemeProvider>,
      ),
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(REACTIONS.length);
    const like = container.querySelector<HTMLButtonElement>('#reaction-thumbs_up')!;
    expect(like.getAttribute('aria-label')).toBe('Like');
    act(() => like.click());
    expect(onSend).toHaveBeenCalledWith('thumbs_up');
  });
});
