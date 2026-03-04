// hooks/useConferenceClient.ts

import { useRef, useEffect, useCallback } from 'react';
// @ts-expect-error: temporary fix for legacy code
import { ConferenceClient, ConferenceConfig, User } from 'red5pro-conference-sdk';
import { getConferenceClientConfig } from '../utils/conferenceConfig';
import log from 'loglevel';

type EventHandler = (...args: any[]) => void;
type EventHandlers = Record<string, EventHandler>;

interface Participant {
  uid: string;
  [key: string]: any;
}

interface VirtualBackgroundStatus {
  isInitialized: boolean;
  isEnabled: boolean;
  backgroundType: string;
}

interface ConferenceStatus {
  isInitialized: boolean;
  isJoined: boolean;
  isPublishing: boolean;
  isScreenSharing: boolean;
}

export const useConferenceClient = () => {
  const conferenceClient = useRef<ConferenceClient | null>(null);
  const isInitialized = useRef(false);

  // Initialize conference client
  useEffect(() => {
    if (!isInitialized.current) {
      const config = getConferenceClientConfig();
      conferenceClient.current = new ConferenceClient(config as unknown as ConferenceConfig);
      isInitialized.current = true;
      log.log('Conference client initialized with config:', config);
    }

    return () => {
      if (conferenceClient.current) {
        // Cleanup on unmount
        if (conferenceClient.current.getIsJoined()) {
          conferenceClient.current
            .leave()
            .catch((err: any) => log.error('Error leaving room on cleanup:', err));
        }
        conferenceClient.current.cleanupChat();
      }
    };
  }, []);

  /**
   * Register event handlers
   */
  const registerEventHandlers = useCallback((handlers: EventHandlers) => {
    if (!conferenceClient.current) {
      log.error('Conference client not initialized');
      return;
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      conferenceClient.current!.on(event, handler);
      log.log(`Registered handler for event: ${event}`);
    });
  }, []);

  /**
   * Unregister event handlers
   */
  const unregisterEventHandlers = useCallback((events: string[]) => {
    if (!conferenceClient.current) return;

    events.forEach((event) => {
      conferenceClient.current!.off(event, () => {});
      log.log(`Unregistered handler for event: ${event}`);
    });
  }, []);

  /**
   * Join a conference room
   */
  const joinRoom = useCallback(
    async (
      roomName: string,
      streamId: string,
      token: string,
      role: string,
      mediaStream?: MediaStream,
      videoEnabled?: boolean,
      audioEnabled?: boolean,
      metadata?: Record<string, any>,
    ): Promise<boolean> => {
      if (!conferenceClient.current) {
        throw new Error('Conference client not initialized');
      }

      try {
        log.log(`Joining room: ${roomName} as ${streamId} with role ${role}`);
        await conferenceClient.current.join(
          roomName,
          streamId,
          token,
          role,
          mediaStream!,
          videoEnabled,
          audioEnabled,
          metadata,
        );
        log.log('Successfully joined room');
        return true;
      } catch (error) {
        log.error('Failed to join room:', error);
        throw error;
      }
    },
    [],
  );

  /**
   * Leave the conference room
   */
  const leaveRoom = useCallback(async () => {
    if (!conferenceClient.current) return;

    try {
      await conferenceClient.current.leave();
      log.log('Successfully left room');
      conferenceClient.current.cleanupChat();
    } catch (error) {
      log.error('Failed to leave room:', error);
      throw error;
    }
  }, []);

  /**
   * Subscribe to a participant
   */
  const subscribe = useCallback(async (participant: Participant) => {
    if (!conferenceClient.current) {
      throw new Error('Conference client not initialized');
    }

    try {
      log.log(`Subscribing to participant: ${participant.uid}`);
      await conferenceClient.current.subscribe(participant as unknown as User);
      return true;
    } catch (error) {
      log.error(`Failed to subscribe to ${participant.uid}:`, error);
      throw error;
    }
  }, []);

  /**
   * Mute/unmute audio
   */
  const muteAudio = useCallback(async (mute: boolean = true) => {
    if (!conferenceClient.current || !conferenceClient.current.getIsPublishing()) {
      log.warn('Conference client not initialized');
      return false;
    }

    try {
      if (mute) {
        await conferenceClient.current.muteAudio();
        log.log('Audio muted');
      } else {
        await conferenceClient.current.unmuteAudio();
        log.log('Audio unmuted');
      }
      return true;
    } catch (error) {
      log.error('Failed to toggle audio mute:', error);
      return false;
    }
  }, []);

  /**
   * Mute/unmute video
   */
  const muteVideo = useCallback(async (mute: boolean = true) => {
    if (!conferenceClient.current) {
      log.warn('Conference client not initialized');
      return false;
    }

    try {
      if (mute) {
        await conferenceClient.current.muteVideo();
        log.log('Video muted');
      } else {
        await conferenceClient.current.unmuteVideo();
        log.log('Video unmuted');
      }
      return true;
    } catch (error) {
      log.error('Failed to toggle video mute:', error);
      return false;
    }
  }, []);

  /**
   * Send event to other participants
   */
  const sendEvent = useCallback((eventType: string, data: any) => {
    if (!conferenceClient.current) {
      log.error('Conference client not initialized');
      return false;
    }

    try {
      conferenceClient.current.sendEvent(eventType, data);
      log.log(`Sent event: ${eventType}`, data);
      return true;
    } catch (error) {
      log.error('Failed to send event:', error);
      return false;
    }
  }, []);

  /**
   * Update user metadata
   */
  const setUserMetaData = useCallback((metadata: Record<string, any>) => {
    if (!conferenceClient.current) return false;

    try {
      conferenceClient.current.setUserMetaData(metadata);
      log.log('User metadata updated:', metadata);
      return true;
    } catch (error) {
      log.error('Failed to update user metadata:', error);
      return false;
    }
  }, []);

  /**
   * Switch video device
   */
  const switchVideoDevice = useCallback(async (deviceId: string) => {
    if (!conferenceClient.current) return false;

    try {
      const mediaStream =
        await conferenceClient.current.switchVideoDeviceWithTrackReplacement(deviceId);
      log.log('Switched video device to:', deviceId);
      return mediaStream;
    } catch (error) {
      log.error('Failed to switch video device:', error);
      return null;
    }
  }, []);

  /**
   * Switch audio device
   */
  const switchAudioDevice = useCallback(async (deviceId: string) => {
    if (!conferenceClient.current) return false;

    try {
      const mediaStream =
        await conferenceClient.current.switchAudioDeviceWithTrackReplacement(deviceId);
      log.log('Switched audio device to:', deviceId);
      return mediaStream;
    } catch (error) {
      log.error('Failed to switch audio device:', error);
      return null;
    }
  }, []);

  /**
   * Switch video camera capture (for already publishing stream)
   */
  const switchVideoCameraCapture = useCallback(async (streamId: string, deviceId: string) => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.switchVideoDeviceWithTrackReplacement(deviceId);
      log.log('Switched camera capture to:', deviceId, 'for stream id', streamId);
      return true;
    } catch (error) {
      log.error('Failed to switch camera capture:', error, 'for stream id', streamId);
      return false;
    }
  }, []);

  /**
   * Switch audio input source (for already publishing stream)
   */
  const switchAudioInputSource = useCallback(async (streamId: string, deviceId: string) => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.switchAudioDeviceWithTrackReplacement(deviceId);
      log.log('Switched audio input to:', deviceId, 'for stream id', streamId);
      return true;
    } catch (error) {
      log.error('Failed to switch audio input:', error, 'for stream id', streamId);
      return false;
    }
  }, []);

  /**
   * Set maximum video bitrate
   */
  const setMaxVideoBitrate = useCallback((bitrateKbps: number) => {
    if (!conferenceClient.current) return false;

    try {
      if (!conferenceClient.current.getIsJoined()) {
        conferenceClient.current.config.maxVideoBitrateKbps = bitrateKbps;
      } else {
        conferenceClient.current.setMaxVideoPublishKbps(bitrateKbps);
      }
      log.log('Set max video bitrate to:', bitrateKbps);
      return true;
    } catch (error) {
      log.error('Failed to set video bitrate:', error);
      return false;
    }
  }, []);

  /**
   * Start screen share
   */
  const startScreenShare = useCallback(async (config: any) => {
    if (!conferenceClient.current || !conferenceClient.current.getIsJoined()) {
      log.error('Must be joined to a room to start screen share');
      return false;
    }

    try {
      await conferenceClient.current.startScreenShare(config);
      log.log('Screen share started');
      return true;
    } catch (error) {
      log.error('Failed to start screen share:', error);
      throw error;
    }
  }, []);

  /**
   * Stop screen share
   */
  const stopScreenShare = useCallback(async () => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.stopScreenShare();
      log.log('Screen share stopped');
      return true;
    } catch (error) {
      log.error('Failed to stop screen share:', error);
      throw error;
    }
  }, []);

  /**
   * Initialize virtual background
   */
  const initializeVirtualBackground = useCallback(async () => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.initializeVirtualBackground();
      log.log('Virtual background initialized');
      return true;
    } catch (error) {
      log.error('Failed to initialize virtual background:', error);
      return false;
    }
  }, []);

  /**
   * Enable virtual background
   */
  const enableVirtualBackground = useCallback(async (type: string, options: any) => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.enableVirtualBackground(type, options);
      log.log('Virtual background enabled:', type);
      return true;
    } catch (error) {
      log.error('Failed to enable virtual background:', error);
      return false;
    }
  }, []);

  /**
   * Change virtual background
   */
  const changeVirtualBackground = useCallback(async (type: string, options: any) => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.changeVirtualBackground(type, options);
      log.log('Virtual background changed to:', type);
      return true;
    } catch (error) {
      log.error('Failed to change virtual background:', error);
      return false;
    }
  }, []);

  /**
   * Disable virtual background
   */
  const disableVirtualBackground = useCallback(async () => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.disableVirtualBackground();
      log.log('Virtual background disabled');
      return true;
    } catch (error) {
      log.error('Failed to disable virtual background:', error);
      return false;
    }
  }, []);

  /**
   * Get virtual background status
   */
  const getVirtualBackgroundStatus = useCallback((): VirtualBackgroundStatus => {
    if (!conferenceClient.current) {
      return {
        isInitialized: false,
        isEnabled: false,
        backgroundType: 'none',
      };
    }

    try {
      return <VirtualBackgroundStatus>conferenceClient.current.getVirtualBackgroundStatus();
    } catch (error) {
      log.error('Failed to get virtual background status:', error);
      return {
        isInitialized: false,
        isEnabled: false,
        backgroundType: 'none',
      };
    }
  }, []);

  /**
   * Get conference status
   */
  const getStatus = useCallback((): ConferenceStatus => {
    if (!conferenceClient.current) {
      return {
        isInitialized: false,
        isJoined: false,
        isPublishing: false,
        isScreenSharing: false,
      };
    }

    return {
      isInitialized: true,
      isJoined: conferenceClient.current.getIsJoined(),
      isPublishing: conferenceClient.current.getIsPublishing(),
      isScreenSharing: conferenceClient.current.isScreenSharing || false,
    };
  }, []);

  /**
   * Get connection statistics
   */
  const getConnectionStats = useCallback((connectionId: string) => {
    if (!conferenceClient.current) return null;

    try {
      return conferenceClient.current.getConnectionStats(connectionId);
    } catch (error) {
      log.error('Failed to get connection stats:', error);
      return null;
    }
  }, []);

  /**
   * Get media stream manager
   */
  const getMediaStreamManager = useCallback(() => {
    if (!conferenceClient.current) return null;
    return conferenceClient.current.mediaStreamManager;
  }, []);

  /**
   * Get current stream
   */
  const getCurrentStream = useCallback(() => {
    if (!conferenceClient.current || !conferenceClient.current.mediaStreamManager) return null;
    return conferenceClient.current.mediaStreamManager.getCurrentStream();
  }, []);

  /**
   * Set current stream
   */
  const setCurrentStream = useCallback((stream: MediaStream) => {
    if (!conferenceClient.current || !conferenceClient.current.mediaStreamManager) return false;

    try {
      conferenceClient.current.mediaStreamManager.setCurrentStream(stream);
      return true;
    } catch (error) {
      log.error('Failed to set current stream:', error);
      return false;
    }
  }, []);

  /**
   * Get original stream
   */
  const getOriginalStream = useCallback(() => {
    if (!conferenceClient.current || !conferenceClient.current.mediaStreamManager) return null;
    return conferenceClient.current.mediaStreamManager.getOriginalStream();
  }, []);

  /**
   * Set original stream
   */
  const setOriginalStream = useCallback((stream: MediaStream) => {
    if (!conferenceClient.current || !conferenceClient.current.mediaStreamManager) return false;

    try {
      conferenceClient.current.mediaStreamManager.setOriginalStream(stream);
      return true;
    } catch (error) {
      log.error('Failed to set original stream:', error);
      return false;
    }
  }, []);

  /**
   * Get screen share stream
   */
  const getScreenShareStream = useCallback(() => {
    if (!conferenceClient.current || !conferenceClient.current.mediaStreamManager) return null;
    return conferenceClient.current.mediaStreamManager.getScreenShareStream();
  }, []);

  /**
   * Set screen share stream
   */
  const setScreenShareStream = useCallback((stream: MediaStream) => {
    if (!conferenceClient.current || !conferenceClient.current.mediaStreamManager) return false;

    try {
      conferenceClient.current.mediaStreamManager.setScreenShareStream(stream);
      return true;
    } catch (error) {
      log.error('Failed to set screen share stream:', error);
      return false;
    }
  }, []);

  /**
   * Get subscribers map
   */
  const getSubscribers = useCallback((): Map<string, any> => {
    if (!conferenceClient.current) return new Map();
    return conferenceClient.current.subscribers || new Map();
  }, []);

  /**
   * Get stream name
   */
  const getStreamName = useCallback((): string | null => {
    if (!conferenceClient.current) return null;
    return conferenceClient.current.streamName || null;
  }, []);

  /**
   * Get user metadata
   */
  const getMetaData = useCallback((): Record<string, any> | null => {
    if (!conferenceClient.current) return null;
    return conferenceClient.current.metaData || null;
  }, []);

  /**
   * Approve guest
   */
  const approveGuest = useCallback(async (userId: string) => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.approveGuest(userId);
      log.log('Guest approved:', userId);
      return true;
    } catch (error) {
      log.error('Failed to approve guest:', error);
      return false;
    }
  }, []);

  /**
   * Reject guest
   */
  const rejectGuest = useCallback(async (userId: string) => {
    if (!conferenceClient.current) return false;

    try {
      await conferenceClient.current.rejectGuest(userId);
      log.log('Guest rejected:', userId);
      return true;
    } catch (error) {
      log.error('Failed to reject guest:', error);
      return false;
    }
  }, []);

  /**
   * Cleanup chat
   */
  const cleanupChat = useCallback(() => {
    if (!conferenceClient.current) return;

    try {
      conferenceClient.current.cleanupChat();
      log.log('Chat cleaned up');
    } catch (error) {
      log.error('Failed to cleanup chat:', error);
    }
  }, []);

  return {
    // Core reference
    conferenceClient,

    // Event management
    registerEventHandlers,
    unregisterEventHandlers,

    // Room operations
    joinRoom,
    leaveRoom,

    // Subscription
    subscribe,

    // Media controls
    muteAudio,
    muteVideo,
    switchVideoDevice,
    switchAudioDevice,
    switchVideoCameraCapture,
    switchAudioInputSource,
    setMaxVideoBitrate,

    // Screen sharing
    startScreenShare,
    stopScreenShare,

    // Virtual background
    initializeVirtualBackground,
    enableVirtualBackground,
    changeVirtualBackground,
    disableVirtualBackground,
    getVirtualBackgroundStatus,

    // Communication
    sendEvent,
    setUserMetaData,
    approveGuest,
    rejectGuest,

    // Status and info
    getStatus,
    getConnectionStats,
    getStreamName,
    getMetaData,
    getSubscribers,

    // Media stream management
    getMediaStreamManager,
    getCurrentStream,
    setCurrentStream,
    getOriginalStream,
    setOriginalStream,
    getScreenShareStream,
    setScreenShareStream,

    // Utilities
    cleanupChat,
  };
};
