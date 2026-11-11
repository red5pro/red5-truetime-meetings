import { describe, expect, it, vi } from 'vitest';
import { applyMaxCameraResolution } from './recordingResolution';

const fakeCamera = (
  capabilities: Partial<MediaTrackCapabilities>,
  settings: MediaTrackSettings,
  applyConstraints = vi.fn(async (c: MediaTrackConstraints) => {
    const ideal = (v: unknown) => (v as ConstrainULongRange | undefined)?.ideal;
    settings = { ...settings, width: ideal(c.width), height: ideal(c.height), frameRate: 30 };
  }),
) =>
  ({
    readyState: 'live',
    getCapabilities: () => capabilities,
    getSettings: () => settings,
    applyConstraints,
  }) as unknown as MediaStreamTrack & { applyConstraints: typeof applyConstraints };

describe('applyMaxCameraResolution', () => {
  it('asks for the largest size the camera offers, capped at 30 fps', async () => {
    const track = fakeCamera(
      { width: { max: 3840 }, height: { max: 2160 }, frameRate: { max: 60 } },
      { width: 640, height: 360, frameRate: 30 },
    );

    const result = await applyMaxCameraResolution(track);

    expect(track.applyConstraints).toHaveBeenCalledWith({
      width: { ideal: 3840 },
      height: { ideal: 2160 },
      frameRate: { ideal: 30, max: 30 },
    });
    expect(result).toEqual({ width: 3840, height: 2160, frameRate: 30 });
  });

  it('keeps a lower camera frame rate and rounds odd sizes down to even', async () => {
    const track = fakeCamera(
      { width: { max: 1921 }, height: { max: 1081 }, frameRate: { max: 15 } },
      { width: 640, height: 360, frameRate: 15 },
    );

    await applyMaxCameraResolution(track);

    expect(track.applyConstraints).toHaveBeenCalledWith({
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 15, max: 15 },
    });
  });

  it('keeps the current size when the camera rejects the constraints', async () => {
    const track = fakeCamera(
      { width: { max: 1920 }, height: { max: 1080 } },
      { width: 1280, height: 720, frameRate: 30 },
      vi.fn(async () => {
        throw new Error('OverconstrainedError');
      }),
    );

    expect(await applyMaxCameraResolution(track)).toEqual({
      width: 1280,
      height: 720,
      frameRate: 30,
    });
  });

  it('does nothing when capabilities are unavailable', async () => {
    const track = fakeCamera({}, { width: 640, height: 480 });

    expect(await applyMaxCameraResolution(track)).toEqual({
      width: 640,
      height: 480,
      frameRate: undefined,
    });
    expect(track.applyConstraints).not.toHaveBeenCalled();
    expect(await applyMaxCameraResolution(null)).toBeNull();
  });
});
