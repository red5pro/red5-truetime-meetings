import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import TranscriptionDrawer from './TranscriptionDrawer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values?.[name] ?? '')),
  }),
}));
vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }));
vi.mock('./DrawerButton', () => ({ default: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  vi.useRealTimers();
});

function render(props: Partial<Parameters<typeof TranscriptionDrawer>[0]> = {}) {
  const fetchTranscriptions = vi.fn(() => Promise.resolve());
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <TranscriptionDrawer
          open
          fetchTranscriptions={fetchTranscriptions}
          loading={false}
          error={null}
          data={null}
          {...props}
        />
      </TrueTimeThemeProvider>,
    ),
  );
  return { fetchTranscriptions };
}

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

describe('TranscriptionDrawer', () => {
  it('fetches the chosen recent range', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));
    const { fetchTranscriptions } = render();
    act(() => byId('transcription-range-15').click());
    act(() => byId('transcription-fetch-button').click());
    const end = Date.parse('2026-11-14T12:00:00Z');
    expect(fetchTranscriptions).toHaveBeenCalledWith(end - 15 * 60 * 1000, end);
  });

  it('shows everyone’s lines in the order they were said', () => {
    render({
      data: {
        totalTranscriptionCount: 3,
        transcriptionsByUser: {
          Ada: [
            { text: 'First', timestamp: 1000 },
            { text: 'Third', timestamp: 3000 },
          ],
          Sam: [{ text: 'Second', timestamp: 2000 }],
        },
      },
    });
    const lines = Array.from(byId('transcription-lines').querySelectorAll('li')).map(
      (li) => li.textContent,
    );
    expect(lines.map((line) => line?.match(/First|Second|Third/)?.[0])).toEqual([
      'First',
      'Second',
      'Third',
    ]);
    expect(lines[1]).toContain('Sam');
    expect(document.body.textContent).toContain('Transcript · 3');
  });

  it('says when nothing was transcribed, and shows errors', () => {
    render({ data: { transcriptionsByUser: {} }, error: 'Server unavailable' });
    expect(document.body.textContent).toContain('Nothing was transcribed in this time range');
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Server unavailable');
  });
});
