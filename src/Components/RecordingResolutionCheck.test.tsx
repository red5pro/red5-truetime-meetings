import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import { RecordingResolutionCheck } from './RecordingResolutionCheck';
import type { RecordingSources } from '../hooks/useRecording';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name) => values?.[name] ?? ''),
  }),
}));

const sources = (camera: RecordingSources['camera']): RecordingSources => ({
  camera,
  remotes: [{ id: 'tsahi', name: 'Tsahi', resolution: { width: 640, height: 360 } }],
  composite: { width: 1920, height: 1080, frameRate: 30 },
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

const renderCheck = async (applyResolution: ReturnType<typeof vi.fn>) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <TrueTimeThemeProvider>
        <RecordingResolutionCheck
          open
          preset="1080p"
          onPresetChange={vi.fn()}
          applyResolution={applyResolution}
        />
      </TrueTimeThemeProvider>,
    );
  });
};

const text = () => container.textContent ?? '';
const increaseButton = () =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Increase camera'));

describe('RecordingResolutionCheck', () => {
  it('shows the resolutions that will actually be recorded', async () => {
    const apply = vi.fn().mockResolvedValue(sources({ width: 640, height: 480, frameRate: 30 }));
    await renderCheck(apply);

    expect(text()).toContain('1920×1080 @ 30 fps');
    expect(text()).toContain('640×480 @ 30 fps');
    expect(text()).toContain('Tsahi');
    expect(text()).toContain('640×360');
    expect(apply).toHaveBeenCalledWith('1080p');
  });

  it('raises the camera on request and shows what it delivers', async () => {
    const apply = vi
      .fn()
      .mockResolvedValueOnce(sources({ width: 640, height: 480, frameRate: 30 }))
      .mockResolvedValueOnce(sources({ width: 1280, height: 720, frameRate: 30 }));
    await renderCheck(apply);

    expect(increaseButton()?.textContent).toBe('Increase camera to 1080p');
    await act(async () => increaseButton()!.click());

    expect(apply).toHaveBeenLastCalledWith('1080p', { raiseCamera: true });
    expect(text()).toContain('Your camera delivers at most 1280×720 @ 30 fps');
    expect(increaseButton()).toBeUndefined();
  });

  it('shows no camera warning when the camera already meets the target', async () => {
    const apply = vi.fn().mockResolvedValue(sources({ width: 1920, height: 1080, frameRate: 30 }));
    await renderCheck(apply);

    expect(text()).toContain('Tsahi');
    expect(increaseButton()).toBeUndefined();
  });
});
