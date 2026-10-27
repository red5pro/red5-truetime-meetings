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

  test('pinned participant gets the first row alone and the rest follow in the grid', () => {
    render({ allParticipants: participants(3), pinnedParticipantId: 'remote2' });

    expect(gallery().classList.contains('mobile-grid-layout')).toBe(true);
    const containers = gallery().querySelectorAll('.single-video-container');
    expect(containers[0].classList.contains('mobile-pinned-tile')).toBe(true);
    expect(
      containers[0].querySelector('[data-testid="video-card"]')?.getAttribute('data-pinned'),
    ).toBe('true');
    expect(galleryTileIds()).toEqual(['remote2', 'me', 'remote1', 'remote3']);
    expect(gallery().querySelectorAll('.mobile-pinned-tile')).toHaveLength(1);
  });

  test('pinning overrides the auto arrangements', () => {
    render({ allParticipants: participants(1), layout: 'auto', pinnedParticipantId: 'remote1' });

    expect(gallery().classList.contains('mobile-grid-layout')).toBe(true);
    expect(container.querySelector('.mobile-pip-local')).toBeNull();
    expect(galleryTileIds()).toEqual(['remote1', 'me']);
  });

  test('a pin for a participant who is not present is ignored', () => {
    render({ allParticipants: participants(1), layout: 'auto', pinnedParticipantId: 'gone' });

    expect(gallery().classList.contains('mobile-single-remote-layout')).toBe(true);
  });

  test('overflowing unpinned tiles collapse into the Others tile and keep playing audio', () => {
    render({ allParticipants: participants(10), pinnedParticipantId: 'remote1' });

    // Pinned + 7 visible unpinned tiles, the remaining 3 go into Others.
    expect(galleryTileIds()).toHaveLength(8);
    expect(container.querySelector('[data-testid="others-card"]')?.textContent).toBe('3');
    expect(container.querySelectorAll('.audio-only-participant')).toHaveLength(3);
  });
});
