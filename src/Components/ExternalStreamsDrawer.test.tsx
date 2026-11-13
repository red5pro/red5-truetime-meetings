import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import ExternalStreamsDrawer from './ExternalStreamsDrawer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values?.[name] ?? '')),
  }),
}));
vi.mock('./DrawerButton', () => ({ default: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

const stream = (streamName: string, durationMs = 125000, subscribers = 2) => ({
  nodeState: 'live',
  subscribers,
  nodeRole: 'origin',
  serverAddress: '10.0.0.1',
  streamGuid: `live/${streamName}`,
  streamName,
  durationMs,
});

function render(props: Partial<Parameters<typeof ExternalStreamsDrawer>[0]> = {}) {
  const handlers = {
    fetchStreams: vi.fn(() => Promise.resolve([])),
    addToRoom: vi.fn(() => Promise.resolve()),
    removeFromRoom: vi.fn(() => Promise.resolve()),
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <ExternalStreamsDrawer
          open
          streams={[]}
          participants={{}}
          loading={false}
          error={null}
          {...handlers}
          {...props}
        />
      </TrueTimeThemeProvider>,
    ),
  );
  return handlers;
}

const rows = () =>
  Array.from(document.querySelectorAll('[id^="external-stream-"]')).filter(
    (el) => el.tagName === 'LI',
  );

describe('ExternalStreamsDrawer', () => {
  it('lists streams in the meeting first, with how long they have been live', () => {
    render({
      streams: [stream('camera-b'), stream('camera-a', 30 * 60 * 1000, 5)],
      participants: { x: { uid: 'camera-b' } },
    });
    expect(rows().map((row) => row.id)).toEqual([
      'external-stream-camera-b',
      'external-stream-camera-a',
    ]);
    expect(rows()[0].textContent).toContain('In the meeting');
    expect(rows()[1].textContent).toContain('Live 30m · 5 watching');
    expect(document.body.textContent).toContain('1 of 2 in the meeting');
  });

  it('adds a stream, then refreshes the list', async () => {
    const handlers = render({ streams: [stream('camera-a')] });
    handlers.fetchStreams.mockClear();
    const add = document.querySelector<HTMLButtonElement>('button[aria-label="Add camera-a"]')!;
    await act(async () => add.click());
    expect(handlers.addToRoom).toHaveBeenCalledWith('camera-a');
    expect(handlers.fetchStreams).toHaveBeenCalled();
  });

  it('says when nothing is live', () => {
    render();
    expect(document.body.textContent).toContain('No external streams are live right now');
  });
});
