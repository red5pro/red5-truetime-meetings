import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import VideoCard from './VideoCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name) => values?.[name] ?? ''),
  }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

const baseProps = {
  id: 'red5pro-subscriber-ada',
  streamId: 'ada',
  name: 'Ada Lovelace',
  isMine: false,
  isCamTurnedOff: false,
  isMicMuted: false,
  layout: 'auto',
  pinVideo: vi.fn(),
  unpinVideo: vi.fn(),
  setParticipantIdMuted: vi.fn(),
  setMuteParticipantDialogOpen: vi.fn(),
};

const render = (props: Partial<React.ComponentProps<typeof VideoCard>> = {}) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <VideoCard {...baseProps} {...props} />
      </TrueTimeThemeProvider>,
    ),
  );
};

describe('VideoCard', () => {
  it("renders the SDK's video element inside a labelled tile", () => {
    render({ streamName: 'legacy' } as never);
    const videos = container.querySelectorAll('video');
    expect(videos).toHaveLength(1);
    expect(videos[0].id).toBe('red5pro-subscriber-ada');
    // Legacy layout props don't leak onto the element
    expect(videos[0].getAttribute('streamname')).toBeNull();
    expect(container.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Ada Lovelace',
    );
  });

  it('keeps the video mounted while the camera is off, so audio keeps playing', () => {
    render({ isCamTurnedOff: true });
    expect(container.querySelector('video')).not.toBeNull();
    expect(container.textContent).toContain('AL');
  });

  it('names its actions and asks before muting someone', () => {
    const setParticipantIdMuted = vi.fn();
    const setMuteParticipantDialogOpen = vi.fn();
    render({ setParticipantIdMuted, setMuteParticipantDialogOpen });
    expect(container.querySelector('button[aria-label="Pin Ada Lovelace"]')).not.toBeNull();
    const mute = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Mute Ada Lovelace"]',
    )!;
    act(() => mute.click());
    expect(setParticipantIdMuted).toHaveBeenCalledWith({
      streamId: 'ada',
      streamName: 'Ada Lovelace',
    });
    expect(setMuteParticipantDialogOpen).toHaveBeenCalledWith(true);
  });

  it('offers no mute action for someone already muted, and shows it in the name chip', () => {
    render({ isMicMuted: true });
    expect(container.querySelector('button[aria-label="Mute Ada Lovelace"]')).toBeNull();
    expect(container.querySelector('[data-tile-name] svg')).not.toBeNull();
  });

  it('shows a raised hand and the connection quality as text for assistive tech', () => {
    render({ isRaiseHand: true, connectionQuality: 2 });
    expect(container.textContent).toContain('Hand raised');
    expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Connection quality: poor (2.0 of 5)',
    );
  });

  it('pins and unpins', () => {
    const pinVideo = vi.fn();
    const unpinVideo = vi.fn();
    render({ pinVideo, unpinVideo, pinned: true });
    const unpin = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Pin Ada Lovelace"]',
    )!;
    expect(unpin.getAttribute('aria-pressed')).toBe('true');
    act(() => unpin.click());
    expect(unpinVideo).toHaveBeenCalled();
    expect(pinVideo).not.toHaveBeenCalled();
  });
});
