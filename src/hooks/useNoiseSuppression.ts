// hooks/useNoiseSuppression.ts
import { useState, useCallback, useEffect } from 'react';
import {
  getNoiseSuppressionLevel,
  getNoiseSuppressionPreference,
  saveNoiseSuppressionPreference,
} from '../utils/conferenceConfig';

/** Waiting for a microphone, loading the model, running, or the model couldn't load. */
export type NoiseSuppressionStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/** The SDK's private DeepFilterNet3 suppressor (MediaStreamManager.noiseSuppressor). */
interface Suppressor {
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
 * fields: destination once a microphone goes through it, workletPromise while the model loads,
 * workletNode once it runs. If they aren't there (another SDK version), it reports ready rather
 * than keep the setting locked.
 */
const readStatus = (client: SuppressorOwner | null): NoiseSuppressionStatus => {
  const manager = client?.mediaStreamManager as { noiseSuppressor?: Suppressor | null } | undefined;
  const suppressor = manager?.noiseSuppressor;
  if (!manager) return 'idle';
  if (!suppressor || !('workletNode' in suppressor)) return 'ready';
  if (suppressor.workletNode) return 'ready';
  if (suppressor.workletPromise) return 'loading';
  // A microphone went through it but the model didn't load; the SDK tries again on the next one
  return suppressor.destination ? 'unavailable' : 'idle';
};

export interface UseNoiseSuppressionReturn {
  noiseSuppressionEnabled: boolean;
  noiseSuppressionStatus: NoiseSuppressionStatus;
  toggleNoiseSuppression: (enabled: boolean) => void;
}

/**
 * Noise suppression on the published microphone: on unless turned off (remembered in
 * localStorage). Turning it off sets the suppression level to 0, which only works once the model
 * runs, so the status says when it can be changed.
 */
export const useNoiseSuppression = (conferenceClient: {
  readonly current: object | null;
}): UseNoiseSuppressionReturn => {
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState<boolean>(
    getNoiseSuppressionPreference,
  );
  const [noiseSuppressionStatus, setNoiseSuppressionStatus] =
    useState<NoiseSuppressionStatus>('idle');

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
      (
        conferenceClient.current as SuppressorOwner | null
      )?.mediaStreamManager?.setNoiseSuppressionLevel?.(enabled ? getNoiseSuppressionLevel() : 0);
    },
    [conferenceClient],
  );

  return { noiseSuppressionEnabled, noiseSuppressionStatus, toggleNoiseSuppression };
};
