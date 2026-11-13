// hooks/useNoiseSuppression.ts
import { useState, useCallback, useEffect } from 'react';
import {
  getNoiseSuppressionPercent,
  getNoiseSuppressionPreference,
  noiseSuppressionPercentToLevel,
  saveNoiseSuppressionPercent,
  saveNoiseSuppressionPreference,
} from '../utils/conferenceConfig';

/**
 * Waiting for a microphone, downloading the model files, starting the model, running, or the
 * model couldn't load.
 */
export type NoiseSuppressionStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'unavailable';

/** The SDK's private DeepFilterNet3 suppressor (MediaStreamManager.noiseSuppressor). */
interface Suppressor {
  core?: { isInitialized?: boolean };
  destination?: unknown;
  workletNode?: unknown;
  workletPromise?: Promise<void> | null;
}

interface SuppressorOwner {
  mediaStreamManager?: { setNoiseSuppressionLevel?: (level: number) => void };
}

const POLL_INTERVAL_MS = 500;

/**
 * The SDK has no public signal for when its model is ready, so this reads the suppressor's private
 * fields: destination once a microphone goes through it, workletPromise while the model loads
 * (core.isInitialized stays false until its files are downloaded), workletNode once it runs. If
 * they aren't there (another SDK version), it reports ready rather than keep the setting locked.
 */
const readStatus = (client: SuppressorOwner | null): NoiseSuppressionStatus => {
  const manager = client?.mediaStreamManager as { noiseSuppressor?: Suppressor | null } | undefined;
  const suppressor = manager?.noiseSuppressor;
  if (!manager) return 'idle';
  if (!suppressor || !('workletNode' in suppressor)) return 'ready';
  if (suppressor.workletNode) return 'ready';
  if (suppressor.workletPromise) {
    return suppressor.core?.isInitialized === false ? 'downloading' : 'loading';
  }
  // A microphone went through it but the model didn't load; the SDK tries again on the next one
  return suppressor.destination ? 'unavailable' : 'idle';
};

export interface UseNoiseSuppressionReturn {
  noiseSuppressionEnabled: boolean;
  noiseSuppressionStatus: NoiseSuppressionStatus;
  toggleNoiseSuppression: (enabled: boolean) => void;
  /** Share of the background noise removed while it's on, 0-100 (remembered in localStorage). */
  noiseSuppressionPercent: number;
  setNoiseSuppressionPercent: (percent: number) => void;
}

/**
 * Noise suppression on the published microphone: on unless turned off, at a level the user can
 * choose (both remembered in localStorage). Turning it off sets the suppression level to 0. Changes
 * only take effect once the model runs, so the status says when they can be made.
 */
export const useNoiseSuppression = (conferenceClient: {
  readonly current: object | null;
}): UseNoiseSuppressionReturn => {
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState<boolean>(
    getNoiseSuppressionPreference,
  );
  const [noiseSuppressionStatus, setNoiseSuppressionStatus] =
    useState<NoiseSuppressionStatus>('idle');
  const [noiseSuppressionPercent, setPercent] = useState<number>(getNoiseSuppressionPercent);

  const applyLevel = useCallback(
    (level: number) => {
      (
        conferenceClient.current as SuppressorOwner | null
      )?.mediaStreamManager?.setNoiseSuppressionLevel?.(level);
    },
    [conferenceClient],
  );

  useEffect(() => {
    if (noiseSuppressionStatus === 'ready') return;
    const timer = setInterval(() => {
      setNoiseSuppressionStatus(readStatus(conferenceClient.current as SuppressorOwner | null));
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [conferenceClient, noiseSuppressionStatus]);

  const toggleNoiseSuppression = useCallback(
    (enabled: boolean): void => {
      setNoiseSuppressionEnabled(enabled);
      saveNoiseSuppressionPreference(enabled);
      applyLevel(enabled ? noiseSuppressionPercentToLevel(noiseSuppressionPercent) : 0);
    },
    [applyLevel, noiseSuppressionPercent],
  );

  const setNoiseSuppressionPercent = useCallback(
    (percent: number): void => {
      setPercent(percent);
      saveNoiseSuppressionPercent(percent);
      // While it's off the level stays 0; the new percentage applies when it's turned back on
      if (noiseSuppressionEnabled) applyLevel(noiseSuppressionPercentToLevel(percent));
    },
    [applyLevel, noiseSuppressionEnabled],
  );

  return {
    noiseSuppressionEnabled,
    noiseSuppressionStatus,
    toggleNoiseSuppression,
    noiseSuppressionPercent,
    setNoiseSuppressionPercent,
  };
};
