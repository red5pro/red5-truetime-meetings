import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import InfoTab from './InfoTab';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
const enqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({ enqueueSnackbar: (...args: unknown[]) => enqueueSnackbar(...args) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

describe('InfoTab', () => {
  it('shows the link and copies it', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() =>
      root!.render(
        <TrueTimeThemeProvider>
          <InfoTab
            meetingLink="https://meet.example.com/room-1"
            appVersion="1.2.0-beta"
            buildTime="2026-11-14"
          />
        </TrueTimeThemeProvider>,
      ),
    );

    expect(container.querySelector('#meeting-link')?.textContent).toBe(
      'https://meet.example.com/room-1',
    );
    expect(container.textContent).toContain('Version 1.2.0-beta');
    expect(container.textContent).toContain('Build 2026-11-14');

    await act(async () =>
      container.querySelector<HTMLButtonElement>('#copy-joining-info-button')!.click(),
    );
    expect(writeText).toHaveBeenCalledWith('https://meet.example.com/room-1');
    expect(enqueueSnackbar).toHaveBeenCalledWith('Link copied', expect.anything());
  });
});
