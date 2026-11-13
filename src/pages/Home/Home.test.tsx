import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import Home from './Home';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('nanoid', () => ({ nanoid: () => 'abcd1234' }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  navigate.mockClear();
});

function render() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <Home />
      </TrueTimeThemeProvider>,
    ),
  );
}

const typeRoom = (value: string) => {
  const input = container.querySelector<HTMLInputElement>('#room_name')!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const joinButton = () => container.querySelector<HTMLButtonElement>('#room_join_button')!;

describe('Home', () => {
  it('starts a new meeting in a fresh room', () => {
    render();
    act(() => container.querySelector<HTMLButtonElement>('#create_meeting_button')!.click());
    expect(navigate).toHaveBeenCalledWith('/abcd1234');
  });

  it('joins once a room is typed, with the button or Enter', () => {
    render();
    expect(joinButton().disabled).toBe(true);
    typeRoom('https://meet.example.com/meetings/standup?token=x');
    expect(joinButton().disabled).toBe(false);
    act(() =>
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    expect(navigate).toHaveBeenCalledWith('/standup?token=x');
  });
});
