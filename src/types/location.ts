export interface ParticipantLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  /** True when real geolocation was unavailable and fallback coordinates were used. */
  isMock?: boolean;
}

export type ParticipantLocationsMap = Record<string, ParticipantLocation>;
