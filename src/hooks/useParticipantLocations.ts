import { useCallback, useRef, useState, MutableRefObject } from 'react';
import log from 'loglevel';
import { MetaDataKeys, LocationEventTypes } from '../constants/metaDataKeys';
import { parseMetaData } from '../utils/utils';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
  hasLocationChanged,
} from '../utils/geolocation';
import type { ParticipantLocation, ParticipantLocationsMap } from '../types/location';

type ParticipantsMap = Record<string, { uid: string; metaData?: string }>;

interface ConferenceClientRef {
  current: {
    setUserMetaData?: (metadata: Record<string, unknown>) => boolean;
    metaData?: Record<string, unknown> | string;
  } | null;
}

interface UseParticipantLocationsReturn {
  participantLocations: ParticipantLocationsMap;
  syncLocationsFromParticipants: (participants: ParticipantsMap) => void;
  removeParticipantLocation: (streamId: string) => void;
  handleRemoteLocationUpdate: (
    streamId: string | undefined,
    location: ParticipantLocation | undefined,
  ) => void;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  clearAllLocations: () => void;
}

export const useParticipantLocations = (
  conferenceClientRef: ConferenceClientRef,
  publishStreamIdRef: MutableRefObject<string | null>,
  sendNotificationEvent: (eventType: string, publishStreamId: string, info?: unknown) => void,
): UseParticipantLocationsReturn => {
  const [participantLocations, setParticipantLocations] = useState<ParticipantLocationsMap>({});
  const watchIdRef = useRef<number | null>(null);
  const lastPublishedLocationRef = useRef<ParticipantLocation | null>(null);
  const sendNotificationEventRef = useRef(sendNotificationEvent);

  sendNotificationEventRef.current = sendNotificationEvent;

  const applyLocationUpdate = useCallback(
    (streamId: string, location: ParticipantLocation, source: string) => {
      setParticipantLocations((prev) => {
        const next = { ...prev, [streamId]: location };
        console.log('[Participant location update]', {
          source,
          streamId,
          location,
          allLocations: next,
        });
        return next;
      });
    },
    [],
  );

  const extractLocationFromMetaData = useCallback(
    (metaData: string | null | undefined): ParticipantLocation | null => {
      const parsed = parseMetaData(metaData);
      const location = parsed[MetaDataKeys.LOCATION];
      if (
        location &&
        typeof location.latitude === 'number' &&
        typeof location.longitude === 'number'
      ) {
        return location as ParticipantLocation;
      }
      return null;
    },
    [],
  );

  const syncLocationsFromParticipants = useCallback(
    (participants: ParticipantsMap) => {
      const fromMetadata: ParticipantLocationsMap = {};

      for (const [uid, participant] of Object.entries(participants)) {
        const location = extractLocationFromMetaData(participant.metaData);
        if (location) {
          fromMetadata[uid] = location;
        }
      }

      if (Object.keys(fromMetadata).length === 0) return;

      setParticipantLocations((prev) => {
        const next = { ...prev, ...fromMetadata };
        console.log('[Participant locations synced from metadata]', next);
        return next;
      });
    },
    [extractLocationFromMetaData],
  );

  const removeParticipantLocation = useCallback((streamId: string) => {
    setParticipantLocations((prev) => {
      if (!(streamId in prev)) return prev;
      const next = { ...prev };
      delete next[streamId];
      console.log('[Participant location removed]', { streamId, allLocations: next });
      return next;
    });
  }, []);

  const clearAllLocations = useCallback(() => {
    setParticipantLocations({});
    lastPublishedLocationRef.current = null;
  }, []);

  const updateUserMetadataLocation = useCallback(
    (location: ParticipantLocation) => {
      const client = conferenceClientRef.current;
      if (!client?.setUserMetaData) return;

      const existingMeta =
        typeof client.metaData === 'string'
          ? parseMetaData(client.metaData)
          : (client.metaData as Record<string, unknown>) || {};

      client.setUserMetaData({
        ...existingMeta,
        [MetaDataKeys.LOCATION]: location,
      });
    },
    [conferenceClientRef],
  );

  const publishLocationUpdate = useCallback(
    (location: ParticipantLocation) => {
      const streamId = publishStreamIdRef.current;
      if (!streamId) return;

      updateUserMetadataLocation(location);
      sendNotificationEventRef.current(LocationEventTypes.LOCATION_UPDATE, streamId, {
        senderStreamId: streamId,
        location,
      });
      applyLocationUpdate(streamId, location, 'local-publish');
      lastPublishedLocationRef.current = location;
    },
    [publishStreamIdRef, updateUserMetadataLocation, applyLocationUpdate],
  );

  const handleRemoteLocationUpdate = useCallback(
    (streamId: string | undefined, location: ParticipantLocation | undefined) => {
      if (!streamId || !location) return;
      if (streamId === publishStreamIdRef.current) return;

      applyLocationUpdate(streamId, location, 'data-channel');
    },
    [publishStreamIdRef, applyLocationUpdate],
  );

  const onLocationPositionUpdate = useCallback(
    (location: ParticipantLocation) => {
      if (!hasLocationChanged(lastPublishedLocationRef.current, location)) return;
      publishLocationUpdate(location);
    },
    [publishLocationUpdate],
  );

  const startLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) return;

    // watchPosition delivers updates once CoreLocation has a fix; avoid a
    // duplicate getCurrentPosition call that often hits kCLErrorLocationUnknown on macOS.
    watchIdRef.current = watchLocation(onLocationPositionUpdate);

    getCurrentLocation().then((location) => {
      publishLocationUpdate(location);
    });

    log.log('Participant location tracking started');
  }, [onLocationPositionUpdate, publishLocationUpdate]);

  const stopLocationTracking = useCallback(() => {
    clearLocationWatch(watchIdRef.current);
    watchIdRef.current = null;
    log.log('Participant location tracking stopped');
  }, []);

  return {
    participantLocations,
    syncLocationsFromParticipants,
    removeParticipantLocation,
    handleRemoteLocationUpdate,
    startLocationTracking,
    stopLocationTracking,
    clearAllLocations,
  };
};
