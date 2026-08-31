import { useCallback, useEffect, useRef, MutableRefObject } from 'react';
import log from 'loglevel';
import { getDataChannelHeartbeatConfig } from '../utils/conferenceConfig';

type HeartbeatPublisher = {
  getDataChannel?: () => RTCDataChannel | null | undefined;
};

type HeartbeatClient = {
  getIsJoined?: () => boolean;
  getIsPublishing?: () => boolean;
  streamName?: string | null;
  publisher?: HeartbeatPublisher | null;
  isScreenSharing?: boolean;
  screenSharePublisher?: HeartbeatPublisher | null;
};

const sendHeartbeatOnPublisher = (
  publisher: HeartbeatPublisher | null | undefined,
  streamName: string | null | undefined,
): boolean => {
  if (!publisher?.getDataChannel) {
    return false;
  }

  const dataChannel = publisher.getDataChannel();
  if (!dataChannel || dataChannel.readyState !== 'open') {
    return false;
  }

  dataChannel.send(
    JSON.stringify({
      type: 'conference',
      message: 'heartbeat',
      streamName,
    }),
  );

  return true;
};

export const useDataChannelHeartbeat = (
  conferenceClientRef: MutableRefObject<HeartbeatClient | null>,
) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { enabled, intervalMs } = getDataChannelHeartbeatConfig();

  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const sendHeartbeat = useCallback(() => {
    if (!enabled) {
      return;
    }

    const client = conferenceClientRef.current;
    if (!client?.getIsJoined?.() || !client?.getIsPublishing?.()) {
      return;
    }

    try {
      const streamName = client.streamName ?? null;
      const sentOnPublisher = sendHeartbeatOnPublisher(client.publisher, streamName);

      if (client.isScreenSharing) {
        sendHeartbeatOnPublisher(client.screenSharePublisher, streamName);
      }

      if (sentOnPublisher) {
        log.debug('Data channel heartbeat sent');
      }
    } catch (error) {
      log.warn('Failed to send data channel heartbeat:', error);
    }
  }, [conferenceClientRef, enabled]);

  const startHeartbeat = useCallback(() => {
    if (!enabled) {
      return;
    }

    stopHeartbeat();
    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, intervalMs);
    log.log(`Data channel heartbeat started (every ${intervalMs}ms)`);
  }, [enabled, intervalMs, sendHeartbeat, stopHeartbeat]);

  useEffect(() => stopHeartbeat, [stopHeartbeat]);

  return {
    startHeartbeat,
    stopHeartbeat,
    sendHeartbeat,
  };
};
