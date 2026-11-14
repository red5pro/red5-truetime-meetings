import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import ParticipantTab from './ParticipantTab';
import { USER_ROLES } from '../constants/userRoles';

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

const participants = {
  me: { name: 'Me' },
  zoe: { name: 'Zoe Park', audioEnabled: false },
  ada: { name: 'Ada Lovelace' },
  sam: { name: 'Sam Lee', isRaiseHand: true },
};

function render(props: Partial<Parameters<typeof ParticipantTab>[0]> = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <ParticipantTab
          participantCount={4}
          publishStreamId="me"
          participants={participants}
          role="participant"
          blockUser={vi.fn()}
          {...props}
        />
      </TrueTimeThemeProvider>,
    ),
  );
}

const rowIds = () =>
  Array.from(container.querySelectorAll('[id^="participant-item-"]')).map((row) =>
    row.id.replace('participant-item-', ''),
  );

const type = (value: string) => {
  const input = container.querySelector<HTMLInputElement>('#participant-search')!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

describe('ParticipantTab', () => {
  it('lists you first, then raised hands, then everyone by name, with their status', () => {
    render({ isMyMicMuted: true });
    expect(rowIds()).toEqual(['me', 'sam', 'ada', 'zoe']);
    expect(container.textContent).toContain('In the meeting · 4');
    expect(
      container.querySelector('#participant-item-sam [aria-label="Hand raised"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('#participant-item-zoe [aria-label="Microphone off"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('#participant-item-me [aria-label="Microphone off"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('#participant-item-ada [aria-label="Microphone off"]'),
    ).toBeNull();
  });

  it('filters by name and says when no one matches', () => {
    render();
    type('lee');
    expect(rowIds()).toEqual(['sam']);
    type('nobody');
    expect(rowIds()).toEqual([]);
    expect(container.textContent).toContain('No one matches “nobody”');
  });

  it('lets only hosts remove people, and never themselves', () => {
    render();
    expect(container.querySelector('[id^="kick-room-"]')).toBeNull();
    act(() => root!.unmount());
    container.remove();

    const blockUser = vi.fn();
    render({ role: USER_ROLES.ADMIN, blockUser });
    expect(container.querySelector('#kick-room-me')).toBeNull();
    act(() => container.querySelector<HTMLButtonElement>('#kick-room-ada')!.click());
    expect(blockUser).toHaveBeenCalledWith('ada', 1000);
  });

  it('admits or denies guests who are waiting', () => {
    const approveGuest = vi.fn(() => Promise.resolve());
    const rejectGuest = vi.fn(() => Promise.resolve());
    render({
      guestsWaitingApproval: { g1: { uid: 'g1', name: 'Guest One' } },
      approveGuest,
      rejectGuest,
    });
    expect(container.textContent).toContain('Waiting to join · 1');
    act(() =>
      container.querySelector<HTMLButtonElement>('[aria-label="Admit Guest One"]')!.click(),
    );
    expect(approveGuest).toHaveBeenCalledWith('Guest One');
    act(() => container.querySelector<HTMLButtonElement>('[aria-label="Deny Guest One"]')!.click());
    expect(rejectGuest).toHaveBeenCalledWith('Guest One');
  });
});
