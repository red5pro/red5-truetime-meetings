import log from 'loglevel';
import type { ParticipantLocation } from '../types/location';

/** Sentinel watch id when using mock interval instead of navigator.geolocation */
export const MOCK_LOCATION_WATCH_ID = -1;

const DEFAULT_MOCK_LAT = 37.7749;
const DEFAULT_MOCK_LNG = -122.4194;

const mockIntervals = new Map<number, ReturnType<typeof setInterval>>();
const watchFallbackTimers = new Map<number, ReturnType<typeof setTimeout>>();

const positionToLocation = (position: GeolocationPosition): ParticipantLocation => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  timestamp: position.timestamp,
  isMock: false,
});

export function getMockLocation(): ParticipantLocation {
  const envLat = import.meta.env.VITE_MOCK_LOCATION_LAT;
  const envLng = import.meta.env.VITE_MOCK_LOCATION_LNG;
  const latitude = envLat ? Number.parseFloat(envLat) : DEFAULT_MOCK_LAT;
  const longitude = envLng ? Number.parseFloat(envLng) : DEFAULT_MOCK_LNG;

  return {
    latitude: Number.isFinite(latitude) ? latitude : DEFAULT_MOCK_LAT,
    longitude: Number.isFinite(longitude) ? longitude : DEFAULT_MOCK_LNG,
    accuracy: 1000,
    timestamp: Date.now(),
    isMock: true,
  };
}

const isValidPosition = (position: GeolocationPosition): boolean => {
  const { latitude, longitude } = position.coords;
  return Number.isFinite(latitude) && Number.isFinite(longitude);
};

const getPositionErrorLabel = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'permission denied';
    case error.POSITION_UNAVAILABLE:
      return 'position unavailable (location unknown — often transient on macOS)';
    case error.TIMEOUT:
      return 'timed out';
    default:
      return error.message || 'unknown error';
  }
};

const isRecoverableError = (error: GeolocationPositionError): boolean =>
  error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const tryGetPosition = (options: PositionOptions): Promise<ParticipantLocation | null> =>
  new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isValidPosition(position)) {
          resolve(null);
          return;
        }
        resolve(positionToLocation(position));
      },
      (error) => {
        log.debug('Geolocation attempt failed:', getPositionErrorLabel(error), options);
        resolve(null);
      },
      options,
    );
  });

const startMockWatch = (onUpdate: (location: ParticipantLocation) => void): number => {
  const mock = getMockLocation();
  log.warn('Using mock location (geolocation unavailable)', mock);
  onUpdate(mock);

  const intervalId = setInterval(() => {
    onUpdate(getMockLocation());
  }, 60_000);

  mockIntervals.set(MOCK_LOCATION_WATCH_ID, intervalId);
  return MOCK_LOCATION_WATCH_ID;
};

/**
 * Tries real geolocation first; returns mock coordinates when unavailable
 * (e.g. kCLErrorLocationUnknown on macOS).
 */
export async function getCurrentLocation(): Promise<ParticipantLocation> {
  if (!navigator.geolocation) {
    log.warn('Geolocation not supported — using mock location');
    return getMockLocation();
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: false, maximumAge: 120_000, timeout: 20_000 },
    { enableHighAccuracy: false, maximumAge: 60_000, timeout: 30_000 },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 45_000 },
    { enableHighAccuracy: false, maximumAge: 30_000, timeout: 25_000 },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const location = await tryGetPosition(attempts[i]);
    if (location) {
      log.log('Geolocation acquired', { attempt: i + 1, location });
      return location;
    }
    if (i < attempts.length - 1) {
      await delay(1500 * (i + 1));
    }
  }

  const mock = getMockLocation();
  log.warn('Could not determine real location after retries — using mock location', mock);
  return mock;
}

export function watchLocation(onUpdate: (location: ParticipantLocation) => void): number | null {
  if (!navigator.geolocation) {
    return startMockWatch(onUpdate);
  }

  let lastErrorLogAt = 0;
  let consecutiveErrors = 0;
  let mockDelivered = false;

  const deliverMockOnce = (reason: string) => {
    if (mockDelivered) return;
    mockDelivered = true;
    log.warn(`${reason} — using mock location`, getMockLocation());
    onUpdate(getMockLocation());
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (!isValidPosition(position)) return;
      const timer = watchFallbackTimers.get(watchId);
      if (timer) {
        clearTimeout(timer);
        watchFallbackTimers.delete(watchId);
      }
      consecutiveErrors = 0;
      onUpdate(positionToLocation(position));
    },
    (error) => {
      consecutiveErrors += 1;
      const now = Date.now();
      const shouldLog =
        !isRecoverableError(error) ||
        consecutiveErrors === 1 ||
        consecutiveErrors % 5 === 0 ||
        now - lastErrorLogAt > 30_000;

      if (shouldLog) {
        lastErrorLogAt = now;
        log.debug('Location watch:', getPositionErrorLabel(error));
      }

      if (isRecoverableError(error) && consecutiveErrors >= 1) {
        deliverMockOnce(getPositionErrorLabel(error));
      }
    },
    { enableHighAccuracy: false, maximumAge: 15_000, timeout: 60_000 },
  );

  watchFallbackTimers.set(
    watchId,
    setTimeout(() => {
      if (!mockDelivered) {
        deliverMockOnce('No location fix within timeout');
      }
      watchFallbackTimers.delete(watchId);
    }, 12_000),
  );

  return watchId;
}

export function clearLocationWatch(watchId: number | null): void {
  const mockInterval = mockIntervals.get(MOCK_LOCATION_WATCH_ID);
  if (mockInterval) {
    clearInterval(mockInterval);
    mockIntervals.delete(MOCK_LOCATION_WATCH_ID);
  }

  if (watchId !== null && watchId !== MOCK_LOCATION_WATCH_ID && navigator.geolocation) {
    const timer = watchFallbackTimers.get(watchId);
    if (timer) {
      clearTimeout(timer);
      watchFallbackTimers.delete(watchId);
    }
    navigator.geolocation.clearWatch(watchId);
  }
}

/** Returns true if the two locations are meaningfully different (~10m). */
export function hasLocationChanged(
  previous: ParticipantLocation | null | undefined,
  next: ParticipantLocation,
): boolean {
  if (!previous) return true;
  if (previous.isMock !== next.isMock) return true;

  const latDiff = Math.abs(previous.latitude - next.latitude);
  const lonDiff = Math.abs(previous.longitude - next.longitude);
  return latDiff > 0.0001 || lonDiff > 0.0001;
}
