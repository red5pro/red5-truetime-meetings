import type { ConferenceClient } from 'red5pro-conference-sdk';

export interface VideoResolution {
  width: number;
  height: number;
  frameRate?: number;
}

export type ResolutionPreset = '360p' | '720p' | '1080p';

export const RESOLUTION_PRESETS: Record<ResolutionPreset, Required<VideoResolution>> = {
  '360p': { width: 640, height: 360, frameRate: 30 },
  '720p': { width: 1280, height: 720, frameRate: 30 },
  '1080p': { width: 1920, height: 1080, frameRate: 30 },
};

export const DEFAULT_RECORDING_PRESET: ResolutionPreset = '720p';

export const isResolutionPreset = (value: unknown): value is ResolutionPreset =>
  typeof value === 'string' && value in RESOLUTION_PRESETS;

/** What a track actually delivers, or null when it has no size yet (e.g. camera off). */
export const getTrackResolution = (
  track: MediaStreamTrack | null | undefined,
): VideoResolution | null => {
  if (!track || track.readyState === 'ended') return null;
  const { width, height, frameRate } = track.getSettings();
  if (!width || !height) return null;
  return { width, height, frameRate: frameRate ? Math.round(frameRate) : undefined };
};

export const formatResolution = (resolution: VideoResolution | null): string =>
  resolution
    ? `${resolution.width}×${resolution.height}${resolution.frameRate ? ` @ ${resolution.frameRate} fps` : ''}`
    : '—';

// Added to MediaStreamManager in red5pro-conference-sdk after 1.0.8
interface ResolutionAwareStreamManager {
  applyVideoResolution?: (resolution: VideoResolution) => Promise<MediaTrackSettings | null>;
  getCameraTrack?: () => MediaStreamTrack | null;
}

const getStreamManager = (client: ConferenceClient | null) =>
  client?.mediaStreamManager as unknown as
    (ResolutionAwareStreamManager & { getCurrentStream(): MediaStream | null }) | undefined;

export const getCameraTrack = (client: ConferenceClient | null): MediaStreamTrack | null => {
  const manager = getStreamManager(client);
  if (!manager) return null;
  return manager.getCameraTrack?.() ?? manager.getCurrentStream()?.getVideoTracks()[0] ?? null;
};

/**
 * Ask the local camera for a resolution and return what it actually delivers. Cameras
 * pick the closest mode they support, so the result can be lower than requested.
 */
export const applyCameraResolution = async (
  client: ConferenceClient | null,
  resolution: VideoResolution,
): Promise<VideoResolution | null> => {
  const manager = getStreamManager(client);
  if (manager?.applyVideoResolution) {
    await manager.applyVideoResolution(resolution);
  } else {
    // Older SDKs: constrain the track directly. A later camera switch resets it.
    const track = getCameraTrack(client);
    await track?.applyConstraints({
      width: { ideal: resolution.width },
      height: { ideal: resolution.height },
      frameRate: { ideal: resolution.frameRate ?? 30, max: resolution.frameRate ?? 30 },
    });
  }
  return getTrackResolution(getCameraTrack(client));
};
