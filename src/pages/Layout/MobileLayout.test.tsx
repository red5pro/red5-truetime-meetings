import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import LayoutMobile from './MobileLayout.tsx';
import { LayoutMobileProps, ParticipantObject } from './types.ts';

vi.mock('../../Components/Cards/VideoCard.tsx', () => ({
  default: React.forwardRef((props: { streamId: string; pinned?: boolean }, _ref) => (
    <div data-testid="video-card" data-stream-id={props.streamId} data-pinned={!!props.pinned} />
  )),
}));

vi.mock('../../Components/Cards/OthersCard.tsx', () => ({
  default: ({ otherParticipantCount }: { otherParticipantCount: number }) => (
    <div data-testid="others-card">{otherParticipantCount}</div>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const participant = (uid: string): ParticipantObject =>
  ({
    participant: { uid, name: uid, audioEnabled: true, videoEnabled: true },
    mediaStream: null,
  }) as unknown as ParticipantObject;

const participants = (remoteCount: number) => [
  participant('me'),
  ...Array.from({ length: remoteCount }, (_, i) => participant(`remote${i + 1}`)),
];

let container: HTMLDivElement;
let root: Root;

const render = (props: Partial<LayoutMobileProps>) => {
  act(() => {
    root.render(
      <LayoutMobile
        streamName="me"
        isPlayOnly={false}
        pinVideo={() => {}}
        unpinVideo={() => {}}
        layout="auto"
        {...props}
      />,
    );
  });
};

const gallery = () => container.querySelector('.mobile-layout-gallery')!;
const galleryTileIds = () =>
  Array.from(gallery().querySelectorAll('[data-testid="video-card"]')).map((el) =>
    el.getAttribute('data-stream-id'),
  );

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('LayoutMobile', () => {
  test('auto layout with one remote floats the local tile over the remote', () => {
    render({ allParticipants: participants(1), layout: 'auto' });

    expect(gallery().classList.contains('mobile-single-remote-layout')).toBe(true);
    expect(container.querySelector('.mobile-pip-local')).not.toBeNull();
  });

  test('tiled layout always uses the grid without a floating local tile', () => {
    render({ allParticipants: participants(1), layout: 'tiled' });

    expect(gallery().classList.contains('mobile-grid-layout')).toBe(true);
    expect(container.querySelector('.mobile-pip-local')).toBeNull();
    expect(galleryTileIds()).toEqual(['me', 'remote1']);
  });

  test('pinned participant fills the top and the rest go into the scrollable strip', () => {
    render({ allParticipants: participants(3), pinnedParticipantId: 'remote2' });

    expect(gallery().classList.contains('mobile-pinned-layout')).toBe(true);
    const pinnedTile = gallery().querySelector(':scope > .mobile-pinned-tile');
    expect(pinnedTile).not.toBeNull();
    expect(
      pinnedTile?.querySelector('[data-testid="video-card"]')?.getAttribute('data-stream-id'),
    ).toBe('remote2');
    expect(
      pinnedTile?.querySelector('[data-testid="video-card"]')?.getAttribute('data-pinned'),
    ).toBe('true');
    const stripIds = Array.from(
      gallery().querySelectorAll('.mobile-pinned-strip [data-testid="video-card"]'),
    ).map((el) => el.getAttribute('data-stream-id'));
    expect(stripIds).toEqual(['me', 'remote1', 'remote3']);
  });

  test('pinning overrides the auto arrangements', () => {
    render({ allParticipants: participants(1), layout: 'auto', pinnedParticipantId: 'remote1' });

    expect(gallery().classList.contains('mobile-pinned-layout')).toBe(true);
    expect(container.querySelector('.mobile-pip-local')).toBeNull();
    expect(galleryTileIds()).toEqual(['remote1', 'me']);
  });

  test('pinning yourself while alone shows no empty strip', () => {
    render({ allParticipants: participants(0), pinnedParticipantId: 'me' });

    expect(gallery().classList.contains('mobile-pinned-layout')).toBe(true);
    expect(container.querySelector('.mobile-pinned-strip')).toBeNull();
  });

  test('a pin for a participant who is not present is ignored', () => {
    render({ allParticipants: participants(1), layout: 'auto', pinnedParticipantId: 'gone' });

    expect(gallery().classList.contains('mobile-single-remote-layout')).toBe(true);
  });

  test('overflowing grid tiles collapse into the Others tile and keep playing audio', () => {
    render({ allParticipants: participants(10), layout: 'tiled' });

    // 7 visible tiles, the remaining 4 go into Others.
    expect(galleryTileIds()).toHaveLength(7);
    expect(container.querySelector('[data-testid="others-card"]')?.textContent).toBe('4');
    expect(container.querySelectorAll('.audio-only-participant')).toHaveLength(4);
  });
});
