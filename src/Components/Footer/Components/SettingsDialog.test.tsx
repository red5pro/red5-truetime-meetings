import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import SettingsDialog from './SettingsDialog';

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

const devices = {
  videoInputs: [{ deviceId: 'cam', label: 'FaceTime HD', kind: 'videoinput' }],
  audioInputs: [{ deviceId: 'mic', label: 'Built-in Mic', kind: 'audioinput' }],
  audioOutputs: [{ deviceId: 'spk', label: 'Speakers', kind: 'audiooutput' }],
};

function render(section?: 'audio' | 'video') {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <SettingsDialog
          open
          section={section}
          devices={devices}
          selectedCamera="cam"
          selectedMicrophone="mic"
          selectedSpeaker="spk"
          selectedBackgroundMode="none"
          noiseSuppressionStatus="ready"
          noiseSuppressionEnabled
          noiseSuppressionPercent={20}
          onNoiseSuppressionToggle={() => {}}
          onNoiseSuppressionPercentChange={() => {}}
        />
      </TrueTimeThemeProvider>,
    ),
  );
}

const shown = (id: string) => document.getElementById(id) !== null;
const title = () => document.querySelector('#settings-dialog h2')?.textContent;

describe('SettingsDialog', () => {
  it('shows only the camera and video quality for video', () => {
    render('video');
    expect(title()).toContain('Video Settings');
    expect(shown('setting-dialog-camera-select')).toBe(true);
    expect(shown('setting-dialog-bitrate-select')).toBe(true);
    expect(shown('setting-dialog-mic-select')).toBe(false);
    expect(shown('setting-dialog-noise-suppression-switch')).toBe(false);
  });

  it('shows only the microphone, speaker and noise suppression for audio', () => {
    render('audio');
    expect(title()).toContain('Audio Settings');
    expect(shown('setting-dialog-mic-select')).toBe(true);
    expect(shown('setting-dialog-speaker-select')).toBe(true);
    expect(shown('setting-dialog-noise-suppression-switch')).toBe(true);
    expect(shown('setting-dialog-camera-select')).toBe(false);
    expect(shown('setting-dialog-bitrate-select')).toBe(false);
  });
});
