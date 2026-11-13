import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import { CameraTray, MicTray } from './DeviceTrays';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

const button = (id: string) => container.querySelector<HTMLButtonElement>(`#${id}`)!;

const cameras = [
  { deviceId: 'frost', label: 'FrostCam', kind: 'videoinput' },
  { deviceId: 'mac', label: 'MacBook Air Camera', kind: 'videoinput' },
];

describe('CameraTray', () => {
  it('shows the selected camera and toggles blur', () => {
    const onToggleBlur = vi.fn();
    render(
      <CameraTray
        videoInputs={cameras}
        selectedCamera="mac"
        backgroundMode="blur"
        onToggleBlur={onToggleBlur}
      />,
    );
    expect(button('camera-device-select').textContent).toContain('MacBook Air Camera');
    const blur = button('blur-background-button');
    expect(blur.getAttribute('aria-pressed')).toBe('true');
    act(() => blur.click());
    expect(onToggleBlur).toHaveBeenCalled();
  });

  it('disables blur while the camera is off', () => {
    render(<CameraTray videoInputs={cameras} selectedCamera="mac" isCamTurnedOff />);
    expect(button('blur-background-button').disabled).toBe(true);
    expect(button('backgrounds-and-effects-button').disabled).toBe(false);
  });
});

describe('MicTray', () => {
  it('waits for noise suppression to be ready before it can be switched', () => {
    const onChange = vi.fn();
    render(
      <MicTray
        audioInputs={[{ deviceId: 'mic', label: 'Built-in Mic', kind: 'audioinput' }]}
        selectedMicrophone="mic"
        noiseSuppressionStatus="downloading"
        onNoiseSuppressionChange={onChange}
      />,
    );
    const noise = button('noise-suppression-button');
    expect(noise.disabled).toBe(true);
    expect(noise.textContent).toContain('Downloading…');
    // No speakers: no speaker picker
    expect(container.querySelector('#speaker-device-select')).toBeNull();
  });
});
