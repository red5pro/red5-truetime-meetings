// hooks/useConferenceActions.ts
import { useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { USER_ROLES, UserRole } from '../constants/userRoles';
import { isConfigServiceAvailable, isNull, updateMetaData } from '../utils/utils';
import { MetaDataKeys } from '../constants/metaDataKeys';
import log from 'loglevel';
import { getRuntimeConfig } from '../utils/configStore';
import { getBackendConfig } from '../utils/conferenceConfig';
import { PostRequestOptions } from './usePostRequest';

// Type definitions
// Type definitions

interface MediaStream {
  getVideoTracks(): MediaStreamTrack[];
  getAudioTracks(): MediaStreamTrack[];
}

interface MediaStreamManager {
  publisherName: string;
  getCurrentStream(): MediaStream | null;
}

interface ConferenceClient {
  approveGuest(userId: string): unknown;
  rejectGuest(userId: string): unknown;
  mediaStreamManager: MediaStreamManager;
}

interface Client {
  conferenceClient: MutableRefObject<ConferenceClient | null>;
  joinRoom: (
    roomName: string,
    streamId: string,
    token: string,
    role: UserRole,
    stream: MediaStream | null,
    videoEnabled: boolean,
    audioEnabled: boolean,
    metadata: any,
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendEvent: (eventType: string, data: any) => void;
}

interface RoomState {
  publishStreamIdRef: MutableRefObject<string | null>;
  streamName: string;
  isPlayOnly: boolean;
  setIsJoining: (joining: boolean) => void;
  setIsWaitingApproval: (waitingApproval: boolean) => void;
}

interface MediaControls {
  isMyCamTurnedOff: boolean;
  isMyMicMuted: boolean;
}

interface Participants {
  [key: string]: any;
}

interface ParticipantsHook {
  setParticipants: (participants: Participants) => void;
  setSubscribedParticipants: (participants: Participants) => void;
  talkerAudioLevelsRef: MutableRefObject<{ [key: string]: number }>;
  pinnedParticipantIdRef: MutableRefObject<string | null>;
  setPinnedParticipantId: (id: string | null) => void;
  setGuestsWaitingApproval: React.Dispatch<React.SetStateAction<Participants>>;
  setGuestParticipantRequestList: React.Dispatch<React.SetStateAction<string[]>>;
}

interface TokenResponse {
  token: string;
}

interface PostData {
  (url: string, data: any, options?: PostRequestOptions): Promise<TokenResponse>;
}

interface UseConferenceActionsReturn {
  joinRoom: (roomName: string, generatedStreamId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  pinVideo: (streamId: string) => void;
  unpinVideo: (streamId?: string) => void;
  sendNotificationEvent: (eventType: string, publishStreamId: string, info?: any) => void;
  approveGuestJoinRequest: (userId: string) => Promise<void>;
  rejectGuestJoinRequest: (userId: string) => Promise<void>;
}

export const useConferenceActions = (
  client: Client,
  roomState: RoomState,
  mediaControls: MediaControls,
  participantsHook: ParticipantsHook,
  postData: PostData,
  role: UserRole,
  setTokenInitial: (token: string) => void,
  displayMessageInitial: (message: string) => void,
  localVideoCreateInitial: () => Promise<void>,
  googleToken: string | null,
): UseConferenceActionsReturn => {
  const { publishStreamIdRef, streamName, isPlayOnly, setIsJoining, setIsWaitingApproval } =
    roomState;

  const { isMyCamTurnedOff, isMyMicMuted } = mediaControls;

  const {
    setParticipants,
    setSubscribedParticipants,
    talkerAudioLevelsRef,
    pinnedParticipantIdRef,
    setPinnedParticipantId,
    setGuestsWaitingApproval,
    setGuestParticipantRequestList,
  } = participantsHook;

  // Use refs to store latest function references without triggering re-renders
  const postDataRef = useRef(postData);
  const setTokenRef = useRef(setTokenInitial);
  const displayMessageRef = useRef(displayMessageInitial);
  const localVideoCreateRef = useRef(localVideoCreateInitial);

  // Keep refs up to date
  useEffect(() => {
    postDataRef.current = postData;
  }, [postData]);

  useEffect(() => {
    setTokenRef.current = setTokenInitial;
  }, [setTokenInitial]);

  useEffect(() => {
    displayMessageRef.current = displayMessageInitial;
  }, [displayMessageInitial]);

  useEffect(() => {
    localVideoCreateRef.current = localVideoCreateInitial;
  }, [localVideoCreateInitial]);

  const preJoinChecks = useCallback(async (): Promise<boolean> => {
    const configServiceUrl = import.meta.env.VITE_CONFIG_SERVICE_URL;
    const configServiceAvailable = isConfigServiceAvailable();

    try {
      let url = `https://${getRuntimeConfig().VITE_HOST}/as/v1/proxy/whip/live/test`;
      if (configServiceAvailable && configServiceUrl) {
        url = `${configServiceUrl}/api/check-node-group-availability`;
      }

      const response = await fetch(url);

      if (configServiceAvailable) {
        if (response.status === 404) {
          displayMessageRef.current(
            'The configuration server is unreachable. Please verify your connection or contact support.',
          );
          return false;
        }
        if (response.status === 500) {
          const result = await response.json();
          if (result.error === 'Publisher limit reached.') {
            displayMessageRef.current(
              'The node group is reached maximum capacity. Please try again later.',
            );
            return false;
          }
        }
        if (response.status === 200) {
          const result = await response.json();
          if (result.isAvailable === false) {
            displayMessageRef.current(
              'The node group is currently deploying and not yet active. Please try again in a few moments.',
            );
            return false;
          }
        }
      } else {
        if (response.status === 405) {
          return true;
        }
        if (response.status === 404 || response.status === 500) {
          displayMessageRef.current(
            'The node group is currently deploying and not yet active. Please try again in a few moments.',
          );
          return false;
        }
        const result = await response.json();
        if (response.status === 500 && result.error === 'Publisher limit reached.') {
          displayMessageRef.current(
            'The node group is reached maximum capacity. Please try again later.',
          );
          return false;
        }
      }
    } catch (error) {
      displayMessageRef.current('Unable to reach the node group. Please check your deployment.');
      return false;
    }

    if (configServiceAvailable && configServiceUrl) {
      try {
        await fetch(`${configServiceUrl}/api/health-check`);
      } catch (error) {
        displayMessageRef.current(
          'The configuration server is unreachable. Please verify your connection or contact support.',
        );
        return false;
      }
    }
    return true;
  }, []);

  const joinRoomCallback = useCallback(
    async (rName: string, generatedStreamId: string): Promise<void> => {
      const isValid = await preJoinChecks();

      if (!isValid) {
        setIsJoining(false);
        setIsWaitingApproval(false);
        return;
      }

      publishStreamIdRef.current = generatedStreamId;
      setIsJoining(true);
      if (role === USER_ROLES.GUEST) {
        setIsWaitingApproval(true);
      }

      if (client.conferenceClient.current) {
        client.conferenceClient.current.mediaStreamManager.publisherName = streamName;
      }

      const metadata = updateMetaData(null, MetaDataKeys.NAME, streamName);
      let result;

      const backendConfig = getBackendConfig();
      try {
        if (backendConfig.shouldGenerateToken) {
          const url = `${backendConfig.host}${backendConfig.apiEndpoints.generateToken}`;
          result = await postDataRef.current(
            url,
            {
              userId: generatedStreamId,
              roomId: rName,
              role: role,
              expirationMinutes: 300,
            },
            {
              headers: {
                Authorization: `Bearer ${googleToken}`,
              },
            },
          );

          setTokenRef.current(result.token);
        } else {
          result = { token: '' };
          setTokenRef.current('');
        }
      } catch (error) {
        log.error('Join failed:', error);

        displayMessageRef.current('There was an error generating the token. Please try again.');
        setIsJoining(false);
        setIsWaitingApproval(false);
        return;
      }

      try {
        const streamToUse = !isPlayOnly
          ? client.conferenceClient.current?.mediaStreamManager.getCurrentStream() || null
          : null;

        await client.joinRoom(
          rName,
          generatedStreamId,
          result?.token ?? '',
          role,
          streamToUse,
          !isMyCamTurnedOff,
          !isMyMicMuted,
          metadata,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        log.error('Join failed:', error);

        displayMessageRef.current(`Failed to join: ${errorMessage}`);
        setIsJoining(false);
        setIsWaitingApproval(false);
      }
    },
    [
      client,
      setIsJoining,
      setIsWaitingApproval,
      publishStreamIdRef,
      role,
      streamName,
      isPlayOnly,
      isMyCamTurnedOff,
      isMyMicMuted,
      preJoinChecks,
      googleToken,
    ],
  );

  const leaveRoomCallback = useCallback(async (): Promise<void> => {
    try {
      await client.leaveRoom();
      setParticipants({});
      setSubscribedParticipants({});
      talkerAudioLevelsRef.current = {};
      setIsJoining(false);
      setIsWaitingApproval(false);
    } catch (error) {
      log.error('Leave failed:', error);
    }
    localVideoCreateRef.current();
  }, [
    client,
    setParticipants,
    setSubscribedParticipants,
    talkerAudioLevelsRef,
    setIsJoining,
    setIsWaitingApproval,
  ]);

  const pinVideoCallback = useCallback(
    (sid: string): void => {
      log.log('Participant', sid, 'pinned.');
      pinnedParticipantIdRef.current = sid;
      setPinnedParticipantId(sid);
    },
    [pinnedParticipantIdRef, setPinnedParticipantId],
  );

  const unpinVideoCallback = useCallback(
    (sid: string = ''): void => {
      log.log('Participant', sid, 'unpinned.');
      pinnedParticipantIdRef.current = null;
      setPinnedParticipantId(null);
    },
    [pinnedParticipantIdRef, setPinnedParticipantId],
  );

  const sendNotificationEventCallback = useCallback(
    (eventType: string, publishStreamId: string, info?: any): void => {
      client.sendEvent(eventType, {
        streamId: publishStreamId,
        ...(info || {}),
      });
    },
    [client],
  );

  const approveGuestJoinRequestCallback = useCallback(
    async (userId: string): Promise<void> => {
      if (!client.conferenceClient.current?.approveGuest) {
        log.error('approveGuest method not found on conference client');
        return;
      }

      await client.conferenceClient.current.approveGuest(userId);

      setGuestsWaitingApproval((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

      setGuestParticipantRequestList((prev) => prev.filter((id) => id !== userId));

      displayMessageRef.current(`${userId}'s join request approved`);
    },
    [client, setGuestsWaitingApproval, setGuestParticipantRequestList],
  );

  const rejectGuestJoinRequestCallback = useCallback(
    async (userId: string): Promise<void> => {
      if (!client.conferenceClient.current?.rejectGuest) {
        log.error('rejectGuest method not found on conference client');
        return;
      }
      await client.conferenceClient.current.rejectGuest(userId);

      setGuestsWaitingApproval((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

      setGuestParticipantRequestList((prev) => prev.filter((id) => id !== userId));

      displayMessageRef.current(`${userId}'s join request rejected`);
    },
    [client, setGuestsWaitingApproval, setGuestParticipantRequestList],
  );

  return {
    joinRoom: joinRoomCallback,
    leaveRoom: leaveRoomCallback,
    pinVideo: pinVideoCallback,
    unpinVideo: unpinVideoCallback,
    sendNotificationEvent: sendNotificationEventCallback,
    approveGuestJoinRequest: approveGuestJoinRequestCallback,
    rejectGuestJoinRequest: rejectGuestJoinRequestCallback,
  };
};
