import { describe, expect, it, vi } from 'vitest';

const finalize = vi.fn();
const videoSourceOptions = vi.fn();

vi.mock('mediabunny', () => {
  class Output {
    target: { buffer: ArrayBuffer | null };
    constructor({ target }: { target: { buffer: ArrayBuffer | null } }) {
      this.target = target;
    }
    addVideoTrack() {}
    addAudioTrack() {}
    async start() {}
    async finalize() {
      await finalize();
      this.target.buffer = new ArrayBuffer(4);
    }
    async cancel() {}
  }
  class Source {
    errorPromise = new Promise(() => {});
    constructor(_track: unknown, options: unknown) {
      videoSourceOptions(options);
    }
    pause() {}
    resume() {}
  }
  return {
    Output,
    Mp4OutputFormat: class {},
    BufferTarget: class {
      buffer: ArrayBuffer | null = null;
    },
    MediaStreamVideoTrackSource: Source,
    MediaStreamAudioTrackSource: class extends Source {},
    QUALITY_MEDIUM: 'medium',
  };
});

const { MediabunnyRecorder } = await import('./MediabunnyRecorder');

const stream = (video = true) =>
  ({
    getVideoTracks: () => (video ? [{ kind: 'video' }] : []),
    getAudioTracks: () => [],
  }) as unknown as MediaStream;

describe('MediabunnyRecorder', () => {
  it('finalizes once when stop() is called again while stopping', async () => {
    let release!: () => void;
    finalize.mockImplementationOnce(() => new Promise<void>((r) => (release = r)));
    const recorder = new MediabunnyRecorder();
    const onstop = vi.fn();
    recorder.onstop = onstop;
    await recorder.start(stream());

    const first = recorder.stop();
    const second = recorder.stop();
    release();

    const [a, b] = await Promise.all([first, second]);
    expect(a).toBeInstanceOf(Blob);
    expect(b).toBe(a);
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(onstop).toHaveBeenCalledTimes(1);
    expect(await recorder.stop()).toBeNull();
  });

  it('letterboxes video size changes instead of failing the track', async () => {
    const recorder = new MediabunnyRecorder();
    await recorder.start(stream());
    expect(videoSourceOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ sizeChangeBehavior: 'contain' }),
    );
  });
});
