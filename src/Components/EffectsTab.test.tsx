import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import EffectsTab from './EffectsTab';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../utils/configStore', () => ({
  getRuntimeConfig: () => ({
    VITE_VIRTUAL_BACKGROUND_IMAGES: 'https://example.com/a.png,https://example.com/b.png',
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

function render(ui: ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(<TrueTimeThemeProvider>{ui}</TrueTimeThemeProvider>));
}

const tile = (id: string) => container.querySelector<HTMLButtonElement>(`#${id}`)!;

describe('EffectsTab', () => {
  it('labels the blur options and highlights the active mode', () => {
    render(
      <EffectsTab
        setVirtualBackgroundImage={vi.fn()}
        handleBackgroundReplacement={vi.fn()}
        selectedBackgroundMode="blur"
        showPreview={false}
      />,
    );
    expect(tile('effect-blur').textContent).toContain('Blur');
    expect(tile('effect-blur').getAttribute('aria-pressed')).toBe('true');
    expect(tile('effect-none').getAttribute('aria-pressed')).toBe('false');
    expect(tile('effect-image-1').textContent).toContain('Background 2');
  });

  it('applies a choice, shows it while it applies and highlights it once applied', async () => {
    let finish: (ok: boolean) => void = () => {};
    const handleBackgroundReplacement = vi.fn(
      () => new Promise<boolean>((resolve) => (finish = resolve)),
    );
    const props = {
      setVirtualBackgroundImage: vi.fn(),
      handleBackgroundReplacement,
      showPreview: false,
    };
    render(<EffectsTab {...props} selectedBackgroundMode="" />);

    act(() => tile('effect-color-1e3a8a').click());
    expect(handleBackgroundReplacement).toHaveBeenCalledWith({ type: 'color', value: '#1e3a8a' });
    expect(tile('effect-color-1e3a8a').getAttribute('aria-busy')).toBe('true');
    // Other tiles wait until it's done
    expect(tile('effect-blur').disabled).toBe(true);

    await act(async () => finish(true));
    act(() =>
      root!.render(
        <TrueTimeThemeProvider>
          <EffectsTab {...props} selectedBackgroundMode="color" />
        </TrueTimeThemeProvider>,
      ),
    );
    expect(tile('effect-color-1e3a8a').getAttribute('aria-pressed')).toBe('true');
    expect(tile('effect-color-166534').getAttribute('aria-pressed')).toBe('false');
    expect(tile('effect-blur').disabled).toBe(false);
  });

  it('uses the image setter for backgrounds', () => {
    const setVirtualBackgroundImage = vi.fn(() => true);
    render(
      <EffectsTab
        setVirtualBackgroundImage={setVirtualBackgroundImage}
        handleBackgroundReplacement={vi.fn()}
        showPreview={false}
      />,
    );
    act(() => tile('effect-image-0').click());
    expect(setVirtualBackgroundImage).toHaveBeenCalledWith({
      type: 'image',
      value: 'https://example.com/a.png',
    });
  });

  it('turns the choices off and says why while the camera is off', () => {
    render(
      <EffectsTab
        setVirtualBackgroundImage={vi.fn()}
        handleBackgroundReplacement={vi.fn()}
        isCameraOff
        showPreview={false}
      />,
    );
    expect(tile('effect-blur').disabled).toBe(true);
    expect(container.textContent).toContain('Turn on your camera to try backgrounds and effects');
  });
});
