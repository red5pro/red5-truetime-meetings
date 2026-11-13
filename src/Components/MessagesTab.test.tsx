import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import MessagesTab from './MessagesTab';

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
  enqueueSnackbar.mockClear();
});

function render(props: Partial<Parameters<typeof MessagesTab>[0]> = {}) {
  const onSend = vi.fn();
  const onMessageSent = vi.fn();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <MessagesTab onSend={onSend} onMessageSent={onMessageSent} {...props} />
      </TrueTimeThemeProvider>,
    ),
  );
  return { onSend, onMessageSent };
}

const typeMessage = (value: string) => {
  const input = container.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="Send a message"]',
  )!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const sendButton = () =>
  container.querySelector<HTMLButtonElement>('button[aria-label="Send message"]')!;

const pickFiles = (files: File[]) => {
  const input = container.querySelector<HTMLInputElement>('#message-file-input')!;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
};

describe('MessagesTab', () => {
  it('shows messages with their time, links and attachments', () => {
    render({
      messages: [
        { name: 'Ada', message: 'see www.example.com', date: '14:05', eventType: 'MESSAGE' },
        {
          name: 'Ada',
          message: '',
          date: '14:06',
          eventType: 'MESSAGE',
          files: [{ id: '1', name: 'slides.pdf', url: 'https://files.example.com/slides.pdf' }],
        },
        { name: 'You', message: 'thanks', date: '14:07' },
      ],
    });
    const log = container.querySelector('[role="log"]')!;
    expect(log.textContent).toContain('Ada · 14:05');
    expect(log.querySelector('a[href="https://www.example.com"]')).not.toBeNull();
    expect(log.textContent).toContain('slides.pdf');
    expect(log.querySelector('a[href="https://files.example.com/slides.pdf"]')).not.toBeNull();
    expect(log.textContent).toContain('thanks');
  });

  it('sends text and adds your own copy', () => {
    const { onSend, onMessageSent } = render();
    typeMessage('hello');
    act(() => sendButton().click());
    expect(onSend).toHaveBeenCalledWith('hello', undefined);
    expect(onMessageSent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'You', message: 'hello' }),
    );
  });

  it('sends files without text, leaving your copy to the upload', () => {
    const { onSend, onMessageSent } = render();
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    pickFiles([file]);
    expect(container.textContent).toContain('photo.png');
    expect(sendButton().disabled).toBe(false);
    act(() => sendButton().click());
    expect(onSend).toHaveBeenCalledWith('', [file]);
    expect(onMessageSent).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain('photo.png');
  });

  it('turns away files that are too big or of the wrong kind', () => {
    render();
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    const zip = new File(['x'], 'archive.zip', { type: 'application/zip' });
    pickFiles([big, zip]);
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('huge.png'),
      expect.objectContaining({ variant: 'warning' }),
    );
    expect(container.querySelector('[aria-label="Files to send"]')).toBeNull();
  });
});
