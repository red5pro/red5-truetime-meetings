// hooks/useConferenceEvents.ts
import { ConferenceEvents } from 'red5pro-conference-sdk';
import { useEffect, useRef } from 'react';
import { isNull, parseMetaData } from '../utils/utils';
import { MetaDataKeys } from '../constants/metaDataKeys';
import log from 'loglevel';
import { sharedVariables } from '../constants/config';
import { LayoutOptions } from '../utils/layoutOptions';

// ---- Types ----
type NetworkScore = {
  inbound: number;
  outbound: number;
  statsSamples: Record<string, unknown>;
};

type WebRTCIssue = {
  type: string;
  reason: string;
  statsSample: Record<string, unknown>;
};

type Participant = {
  uid: string;
  role: string;
  name?: string;
  metaData?: string;
  isRaiseHand?: boolean;
  isScreenSharing?: boolean;
  ownerStreamId?: string | null;
  ownerName?: string | null;
  [key: string]: any;
};

type ParticipantsMap = Record<string, Participant>;

type ParticipantsHook = {
  participants: ParticipantsMap;
  setParticipants: React.Dispatch<React.SetStateAction<ParticipantsMap>>;
  setSubscribedParticipants: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  updateTalkerLevel: (id: string, level: number) => void;
  clearParticipant: (uid: string) => void;
  subscribedParticipants: Record<string, { participant: Participant; mediaStream: MediaStream }>;
  subscribeAttemptsRef: React.MutableRefObject<
    Record<string, { retryCount: number; inProgress: boolean }>
  >;
  talkerAudioLevelsRef: React.MutableRefObject<Record<string, any>>;
  pinnedParticipantIdRef: React.MutableRefObject<string | null>;
  guestsWaitingApproval?: Record<string, any>;
  setGuestsWaitingApproval: (participants: Record<string, any>) => void;
};

type RoomState = {
  lobbyOrMeetingPage: 'lobby' | 'meeting';
  isJoining: boolean;
  isPublished: boolean;
  isPlayOnly: boolean;
  setIsJoining: (val: boolean) => void;
  setIsWaitingApproval: (val: boolean) => void;
  setIsPublished: (val: boolean) => void;
  setIsPlayed: (val: boolean) => void;
  setLobbyOrMeetingPage: (page: 'lobby' | 'meeting') => void;
  setLeftTheRoom: (val: boolean) => void;
  setLeaveRoomError: (msg: string | null) => void;
  setIsReconnecting: (val: boolean) => void;
  publishStreamIdRef: React.MutableRefObject<string | null>;
  streamNameRef: React.MutableRefObject<string | null>;
};

type ScreenShare = {
  setIsScreenShared: (val: boolean) => void;
  setIsStartingScreenShare: (val: boolean) => void;
  showScreenShareSpinner: React.MutableRefObject<boolean>;
};

type Recording = {
  setIsRecordingActive: (val: boolean) => void;
};

type Client = {
  conferenceClient: React.MutableRefObject<any>;
  subscribe: (participant: Participant) => Promise<void>;
};

export const useConferenceEvents = (
  client: Client,
  participantsHook: ParticipantsHook,
  closedCaptions: any,
  roomState: RoomState,
  mediaControls: any,
  chat: any,
  screenShare: ScreenShare,
  virtualBackground: any,
  recording: Recording,
  localRecording: any,
  displayMessage: (msg: string) => void,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void,
  setNetworkScore: (score: NetworkScore) => void,
  setConnectionStats: (stats: Record<string, unknown>) => void,
  setCurrentIssues: (issues: WebRTCIssue[]) => void,
  printStatLogsRef: React.MutableRefObject<boolean>,
  setUnAuthorizedDialogMessage: (msg: string) => void,
  setUnAuthorizedDialogOpen: (val: boolean) => void,
  handleLeaveFromRoom: () => Promise<void>,
  pinVideo: (uid: string) => void,
  unpinVideo: (uid: string) => void,
  layoutRef: React.MutableRefObject<typeof LayoutOptions>,
  role: string,
) => {
  // Store all dependencies in a ref to avoid closure issues
  const depsRef = useRef<any>({});

  depsRef.current = {
    participantsHook,
    closedCaptions,
    roomState,
    mediaControls,
    chat,
    screenShare,
    virtualBackground,
    recording,
    localRecording,
    displayMessage,
    showSuccess,
    showError,
    setNetworkScore,
    setConnectionStats,
    setCurrentIssues,
    printStatLogsRef,
    setUnAuthorizedDialogMessage,
    setUnAuthorizedDialogOpen,
    handleLeaveFromRoom,
    pinVideo,
    unpinVideo,
    layoutRef,
    role,
  };

  // Event handlers stored in ref
  const eventHandlersRef = useRef<any>({});
  const subscribeRetryTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const joinStartedAtRef = useRef<number | null>(null);
  const publishFailureReportedRef = useRef(false);
  const subscribeStaleSinceRef = useRef<Record<string, number>>({});
  const publishUnhealthySinceRef = useRef<number | null>(null);

  const scheduleSubscribeRetry = (participant: Participant, retryCount: number) => {
    const uid = participant.uid;
    if (subscribeRetryTimersRef.current[uid]) {
      clearTimeout(subscribeRetryTimersRef.current[uid]);
    }
    const delay = Math.min(
      sharedVariables.retryInterval * Math.pow(2, Math.max(0, retryCount - 1)),
      30000,
    );
    subscribeRetryTimersRef.current[uid] = setTimeout(() => {
      delete subscribeRetryTimersRef.current[uid];
      eventHandlersRef.current.subscribeToParticipant(participant);
    }, delay);
  };

  if (!eventHandlersRef.current.initialized) {
    eventHandlersRef.current = {
      initialized: true,

      handlePublishFailure: async (reason: string) => {
        if (publishFailureReportedRef.current) return;
        publishFailureReportedRef.current = true;

        log.error('[StreamHealth] Publish failure:', reason);
        const roomState = depsRef.current.roomState;

        roomState.setIsJoining(false);
        roomState.setIsWaitingApproval(false);
        roomState.setIsPublished(false);
        roomState.setIsPlayed(false);
        roomState.setIsReconnecting(false);
        roomState.setLeaveRoomError(
          reason || 'Unable to publish your stream. Please check your connection and try again.',
        );
        roomState.setLeftTheRoom(true);

        await depsRef.current.handleLeaveFromRoom();
      },

      resubscribeMissingParticipants: () => {
        const participantsHook = depsRef.current.participantsHook;
        const roomState = depsRef.current.roomState;
        const selfId = roomState.publishStreamIdRef.current;

        Object.values(participantsHook.participants).forEach((participant: Participant) => {
          if (participant.role === 'subscriber' || participant.uid === selfId) return;

          const subscribed = participantsHook.subscribedParticipants?.[participant.uid];
          const hasLiveStream =
            subscribed?.mediaStream &&
            subscribed.mediaStream
              .getTracks()
              .some((t: MediaStreamTrack) => t.readyState === 'live');

          if (!hasLiveStream) {
            eventHandlersRef.current.subscribeToParticipant(participant);
          }
        });
      },

      checkStreamHealth: () => {
        const clientInstance = client.conferenceClient.current;
        const roomState = depsRef.current.roomState;
        const participantsHook = depsRef.current.participantsHook;

        if (!clientInstance) return;

        const isInMeeting = roomState.lobbyOrMeetingPage === 'meeting';
        const isJoined = clientInstance.getIsJoined?.() ?? false;
        const isPublishing = clientInstance.getIsPublishing?.() ?? false;
        const isSdkReconnecting = clientInstance.getIsReconnecting?.() ?? false;

        // Publish watchdog while joining (SDK event may not fire)
        if (roomState.isJoining && !roomState.isPublished && !roomState.isPlayOnly) {
          if (!joinStartedAtRef.current) {
            joinStartedAtRef.current = Date.now();
          }
          const elapsed = Date.now() - joinStartedAtRef.current;
          if (elapsed > sharedVariables.publishTimeoutMs) {
            eventHandlersRef.current.handlePublishFailure(
              'Publishing timed out. The server did not confirm your stream.',
            );
          }
          return;
        }

        if (!isInMeeting || roomState.isPlayOnly) return;

        // Publish health while in meeting (with grace period for transient states)
        if (isSdkReconnecting || roomState.isReconnecting) {
          publishUnhealthySinceRef.current = null;
          return;
        }

        if (isJoined && !isPublishing) {
          const streamName = clientInstance.streamName;
          let connectionBad = false;
          if (streamName) {
            const stats = clientInstance.getConnectionStats?.(streamName);
            const state = stats?.current?.connectionState ?? stats?.current?.iceConnectionState;
            connectionBad = state === 'failed' || state === 'closed' || state === 'disconnected';
          }

          if (!publishUnhealthySinceRef.current) {
            publishUnhealthySinceRef.current = Date.now();
          }

          const unhealthyFor = Date.now() - publishUnhealthySinceRef.current;
          if (connectionBad || unhealthyFor > sharedVariables.publishRecoveryGraceMs) {
            eventHandlersRef.current.handlePublishFailure(
              connectionBad
                ? 'Your publish connection was lost unexpectedly.'
                : 'Your publish stream is no longer active.',
            );
          }
          return;
        }

        publishUnhealthySinceRef.current = null;

        if (isSdkReconnecting || roomState.isReconnecting) return;

        // Subscribe health: participants missing live media
        const selfId = roomState.publishStreamIdRef.current;
        const now = Date.now();

        Object.values(participantsHook.participants).forEach((participant: Participant) => {
          if (participant.role === 'subscriber' || participant.uid === selfId) return;

          const subscribed = participantsHook.subscribedParticipants?.[participant.uid];
          const hasLiveStream =
            subscribed?.mediaStream &&
            subscribed.mediaStream
              .getTracks()
              .some((t: MediaStreamTrack) => t.readyState === 'live');

          if (hasLiveStream) {
            delete subscribeStaleSinceRef.current[participant.uid];
            return;
          }

          if (!subscribeStaleSinceRef.current[participant.uid]) {
            subscribeStaleSinceRef.current[participant.uid] = now;
            return;
          }

          if (
            now - subscribeStaleSinceRef.current[participant.uid] <
            sharedVariables.subscribeStaleMs
          ) {
            return;
          }

          const attempts = participantsHook.subscribeAttemptsRef.current[participant.uid];
          if (attempts?.inProgress) return;

          if ((attempts?.retryCount ?? 0) >= sharedVariables.maxRetries) {
            log.error(
              `[StreamHealth] Max subscribe retries for ${participant.uid}; participant stays pending`,
            );
            depsRef.current.showError(
              `Could not connect to ${participant.name || participant.uid}. Retrying in background.`,
            );
            participantsHook.subscribeAttemptsRef.current[participant.uid] = {
              retryCount: 0,
              inProgress: false,
            };
          }

          log.warn(`[StreamHealth] Stale subscribe for ${participant.uid}, triggering retry`);
          subscribeStaleSinceRef.current[participant.uid] = now;
          if (!attempts) {
            participantsHook.subscribeAttemptsRef.current[participant.uid] = {
              retryCount: 0,
              inProgress: false,
            };
          }
          participantsHook.subscribeAttemptsRef.current[participant.uid].retryCount++;
          scheduleSubscribeRetry(participant, attempts?.retryCount ?? 1);
        });
      },

      handleLocalRecordingEnabled: () => {
        console.log('Local recording enabled!');
        depsRef.current.localRecording.startLocalRecording();
      },

      handleTranscriptionResult: (data: any) => {
        console.log('Transcription data', data, depsRef.current.participantsHook.participants);
        const captionData = data.messageEvent;
        captionData.speaker = captionData.streamId;
        depsRef.current.closedCaptions.addCaption(captionData);
      },

      handleEnableVirtualBackgroundControls: () => {
        console.log('Virtual background initialized!');
      },

      handleVirtualBackgroundEnabled: (data: any) => {
        console.log('Virtual background effect', data.type, 'enabled');
        depsRef.current.showSuccess('Virtual background effect ' + data.type + ' enabled');
      },

      handleVirtualBackgroundDisabled: () => {
        console.log('Virtual background disabled');
        depsRef.current.showSuccess('Virtual background disabled!');
      },

      handleVirtualBackgroundChanged: (data: any) => {
        console.log('Virtual background effect', data.type, 'enabled');
        depsRef.current.showSuccess('Virtual background effect ' + data.type + ' enabled');
      },

      handleVirtualBackgroundEnableFailed: (data: any) => {
        console.error('Virtual background enable failed:', data);
        depsRef.current.showError('Virtual background failed: ' + data.error);
      },

      handleNetworkScoresUpdated: (scores: any) => {
        if (depsRef.current.printStatLogsRef.current) {
          console.log('Network Quality Update:');
          console.log('Inbound score:', scores.inbound);
          console.log('Outbound score:', scores.outbound);
          console.log('Detailed stats:', scores.statsSamples);
        }
        depsRef.current.setNetworkScore(scores);
        eventHandlersRef.current.updateDetailedStats();
      },

      handleConnectionStateChanged: (data: any) => {
        if (depsRef.current.printStatLogsRef.current) {
          console.log(`Connection ${data.connectionId} state: ${data.state}`);
        }
      },

      handleConnectionFailed: (data: any) => {
        if (depsRef.current.printStatLogsRef.current) {
          console.log(`Connection ${data.connectionId} failed`);
        }
      },

      handleScreenShareStarted: (data: any) => {
        log.log('Screen share started:', data);
        depsRef.current.displayMessage('You are sharing your screen.');
        if (data.stream) {
          client.conferenceClient.current.mediaStreamManager.setScreenShareStream(data.stream);
        }
        depsRef.current.screenShare.setIsScreenShared(true);
        depsRef.current.screenShare.setIsStartingScreenShare(false);
      },

      handleScreenShareStopped: () => {
        log.log('Screen share stopped');
        depsRef.current.displayMessage('Screen sharing has ended.');
        client.conferenceClient.current.mediaStreamManager.setScreenShareStream(null);
        depsRef.current.screenShare.setIsScreenShared(false);
        depsRef.current.screenShare.setIsStartingScreenShare(false);
        depsRef.current.screenShare.showScreenShareSpinner.current = false;
      },

      handleScreenShareFailed: (data: any) => {
        log.log('Screen share is failed:', data);
        client.conferenceClient.current.mediaStreamManager.setScreenShareStream(null);
        depsRef.current.screenShare.setIsScreenShared(false);
        depsRef.current.screenShare.setIsStartingScreenShare(false);
        depsRef.current.screenShare.showScreenShareSpinner.current = false;
      },

      handleConnectFail: () => {
        log.log('Connect fail');
        depsRef.current.roomState.setIsJoining(false);
        depsRef.current.roomState.setIsWaitingApproval(false);
        depsRef.current.displayMessage('Failed to join: Connection failed');
      },

      handleConnectionClosed: () => {
        log.log('Connection closed');
        const clientInstance = client.conferenceClient.current;
        const isSdkReconnecting = clientInstance?.getIsReconnecting?.() ?? false;

        if (isSdkReconnecting || clientInstance?.config?.reconnectionEnabled) {
          depsRef.current.roomState.setIsReconnecting(true);
          depsRef.current.displayMessage('Connection lost. Reconnecting...');
          return;
        }

        depsRef.current.displayMessage('Connection closed');
        eventHandlersRef.current.handlePublishFailure(
          'The meeting connection was closed unexpectedly.',
        );
      },

      handleReconnectionAttempt: (data: any) => {
        log.log('Reconnection attempt', data);
        depsRef.current.roomState.setIsReconnecting(true);
        depsRef.current.displayMessage('Reconnecting to the meeting...');
      },

      handleReconnectionSuccess: () => {
        log.log('Reconnection success');
        depsRef.current.roomState.setIsReconnecting(false);
        publishFailureReportedRef.current = false;
        depsRef.current.showSuccess('Reconnected successfully');
        eventHandlersRef.current.resubscribeMissingParticipants();
      },

      handleReconnectionFailed: () => {
        log.error('Reconnection failed');
        depsRef.current.roomState.setIsReconnecting(false);
        eventHandlersRef.current.handlePublishFailure(
          'Could not reconnect to the meeting. Please try again.',
        );
      },

      handleReconnectionError: (data: any) => {
        log.error('Reconnection error', data);
        depsRef.current.roomState.setIsReconnecting(false);
      },

      handleSubscribeFailed: (data: any) => {
        log.error('Subscribe failed:', data.user.uid, data.error);

        if (isNull(data.user.uid)) return;

        const participantsHook = depsRef.current.participantsHook;

        if (!participantsHook.subscribeAttemptsRef.current[data.user.uid]) {
          participantsHook.subscribeAttemptsRef.current[data.user.uid] = {
            retryCount: 0,
            inProgress: false,
          };
        }

        participantsHook.subscribeAttemptsRef.current[data.user.uid].retryCount++;
        participantsHook.subscribeAttemptsRef.current[data.user.uid].inProgress = false;

        const retryCount = participantsHook.subscribeAttemptsRef.current[data.user.uid].retryCount;
        log.warn(
          `Subscription failed for ${data.user.uid}. Attempt ${retryCount}/${sharedVariables.maxRetries}. Retrying with backoff.`,
        );

        if (retryCount >= sharedVariables.maxRetries) {
          log.error(`Max subscription attempts reached for ${data.user.uid}`);
          depsRef.current.showError(
            `Could not subscribe to ${data.user.name || data.user.uid}. Will keep retrying.`,
          );
          participantsHook.subscribeAttemptsRef.current[data.user.uid].retryCount = 0;
        }

        scheduleSubscribeRetry(data.user, retryCount);
      },

      handleAudioLevel: (data: any) => {
        depsRef.current.participantsHook.updateTalkerLevel(data.userId, data.level.normalized);
      },

      handleSubscribeStop: (data: any) => {
        console.log('handleSubscribeStop', data);
        eventHandlersRef.current.clearRemoteSubscriber(data.uid);
        depsRef.current.participantsHook.clearParticipant(data.uid);
      },

      handleAudioMuted: (_data: any) => {
        // Implementation if needed
      },

      handleVideoMuted: (_data: any) => {
        // Implementation if needed
      },

      handleDataChannelAvailable: () => {
        log.log('Data channel available');
      },

      handleJoinFail: async (data: any) => {
        if (depsRef.current.role === 'guest') {
          return;
        }

        log.log('Join fail:', data);

        if (data?.statusCode === 401) {
          await depsRef.current.handleLeaveFromRoom();
          depsRef.current.roomState.setIsJoining(false);
          depsRef.current.roomState.setIsWaitingApproval(false);
          depsRef.current.setUnAuthorizedDialogMessage(
            'Publish failed, due to an error. Please try again.',
          );
          depsRef.current.setUnAuthorizedDialogOpen(true);
          return;
        }

        const message =
          data?.error || data?.message || 'Failed to join the meeting due to an unexpected error.';
        await eventHandlersRef.current.handlePublishFailure(message);
      },

      handlePublishFailed: async (data: any) => {
        log.error('Publish failed (init):', data);
        const message = data?.error || 'Failed to start publishing your stream.';
        await eventHandlersRef.current.handlePublishFailure(message);
      },

      handleJoinBlock: async (data: any) => {
        log.log('Join block:', data);

        // if guest, change the error message
        let errorMessage =
          'You are blocked in this room. Please contact the room owner to unblock you.';
        if (depsRef.current.role === 'guest') {
          errorMessage = 'Your join request has been rejected.';
        }

        depsRef.current.handleLeaveFromRoom().then(() => console.log(errorMessage));

        depsRef.current.roomState.setIsJoining(false);
        depsRef.current.roomState.setIsWaitingApproval(false);
        depsRef.current.setUnAuthorizedDialogMessage(errorMessage);
        depsRef.current.setUnAuthorizedDialogOpen(true);
      },

      handleParticipantMediaUpdate: (data: any) => {
        log.log('Participant media update:', data);
        const { streamName, videoEnabled, audioEnabled } = data;

        console.log('Participant media update', depsRef.current.participantsHook.participants);

        const participantsHook = depsRef.current.participantsHook;

        // Update main participants
        // @ts-ignore
        participantsHook.setParticipants((prevParticipants) => ({
          ...prevParticipants,
          [streamName]: {
            ...prevParticipants[streamName],
            videoEnabled,
            audioEnabled,
          },
        }));

        // Update subscribedParticipants if the participant exists
        // @ts-ignore
        participantsHook.setSubscribedParticipants((prev) => {
          const existing = prev[streamName];
          if (!existing) return prev;

          return {
            ...prev,
            [streamName]: {
              ...existing,
              participant: {
                ...existing.participant,
                videoEnabled,
                audioEnabled,
              },
            },
          };
        });
      },

      handleSubscribeSuccess: (data: any) => {
        log.log('Subscribe success:', data.uid);

        delete subscribeStaleSinceRef.current[data.uid];
        if (subscribeRetryTimersRef.current[data.uid]) {
          clearTimeout(subscribeRetryTimersRef.current[data.uid]);
          delete subscribeRetryTimersRef.current[data.uid];
        }

        const participantsHook = depsRef.current.participantsHook;
        const roomState = depsRef.current.roomState;
        const screenShare = depsRef.current.screenShare;
        const displayMessage = depsRef.current.displayMessage;
        const pinVideo = depsRef.current.pinVideo;

        participantsHook.subscribeAttemptsRef.current[data.uid] = {
          retryCount: 0,
          inProgress: false,
        };

        // @ts-ignore
        participantsHook.setSubscribedParticipants((prev) => ({
          ...prev,
          [data.uid]: {
            participant: data.participant,
            mediaStream: data.mediaStream,
          },
        }));

        if (data.participant.metaData === 'external-stream') {
          pinVideo(data.uid);
          return;
        }

        const metaData = parseMetaData(data.participant.metaData);

        if (metaData[MetaDataKeys.IS_SCREEN_SHARING] === true) {
          pinVideo(data.uid);
        }

        if (
          metaData[MetaDataKeys.IS_SCREEN_SHARING] === true &&
          metaData[MetaDataKeys.OWNER_STREAM_ID] === roomState.publishStreamIdRef.current
        ) {
          screenShare.showScreenShareSpinner.current = false;
        } else if (metaData[MetaDataKeys.IS_SCREEN_SHARING] === true) {
          displayMessage(metaData[MetaDataKeys.OWNER_NAME] + ' is sharing their screen.');
        }
      },

      handleRoomStateUpdate: (data: any) => {
        console.log('handleRoomStateUpdate', data);
        depsRef.current.recording.setIsRecordingActive(data.roomState.recording);
        if (data.roomState.localRecordingEnabled) {
          depsRef.current.recording.startLocalRecording();
        } else if (
          data.roomState.localRecordingEnabled === false &&
          depsRef.current.recording.isLocalRecordingActive
        ) {
          depsRef.current.recording.stopLocalRecording();
        }
      },

      handleGuestJoinRequest: (data: any) => {
        console.log('handleGuestJoinRequest', data);
        const participantsHook = depsRef.current.participantsHook;
        const guestsWaitingApproval = { ...(participantsHook.guestsWaitingApproval || {}) };
        guestsWaitingApproval[data.streamName] = {
          streamId: data.streamName,
          name: data.streamName,
          streamName: data.streamName,
        };
        participantsHook.setGuestsWaitingApproval(guestsWaitingApproval);

        displayMessage(`${data.streamName} requested to join the room`);
      },

      handleNewParticipant: async (data: any) => {
        log.log('New participant:', data.participant);

        const newParticipant = data.participant;
        const newParticipantMetaData = parseMetaData(data.participant.metaData);
        newParticipant.name = newParticipantMetaData[MetaDataKeys.NAME] || newParticipant.uid;
        newParticipant.isRaiseHand = newParticipantMetaData[MetaDataKeys.IS_RAISED_HAND] || false;
        newParticipant.isScreenSharing =
          newParticipantMetaData[MetaDataKeys.IS_SCREEN_SHARING] || false;
        newParticipant.ownerStreamId = newParticipantMetaData[MetaDataKeys.OWNER_STREAM_ID] || null;
        newParticipant.ownerName = newParticipantMetaData[MetaDataKeys.OWNER_NAME] || null;

        const participantsHook = depsRef.current.participantsHook;

        // @ts-ignore
        participantsHook.setParticipants((prev) => ({
          ...prev,
          [newParticipant.uid]: newParticipant,
        }));

        log.log('participants', participantsHook.participants);

        participantsHook.subscribeAttemptsRef.current[newParticipant.uid] = {
          retryCount: 0,
          inProgress: false,
        };

        if (newParticipant.role !== 'subscriber') {
          setTimeout(async () => {
            eventHandlersRef.current.subscribeToParticipant(newParticipant);
          }, 2000);
        }
      },

      handleParticipantDisconnected: (data: any) => {
        log.log('Participant disconnected:', data.participant);

        const participantsHook = depsRef.current.participantsHook;

        eventHandlersRef.current.clearRemoteSubscriber(data.participant.uid);

        // Remove from participants
        // @ts-ignore
        participantsHook.setParticipants((prev) => {
          const newParticipants = { ...prev };
          delete newParticipants[data.participant.uid];
          return newParticipants;
        });

        // @ts-ignore
        participantsHook.setSubscribedParticipants((prev) => {
          const newSubscribed = { ...prev };
          delete newSubscribed[data.participant.uid];
          return newSubscribed;
        });

        // Remove audio level for disconnected participant
        const newTalkers = { ...participantsHook.talkerAudioLevelsRef.current };
        delete newTalkers[data.participant.uid];
        participantsHook.talkerAudioLevelsRef.current = newTalkers;
      },

      handleUserPublished: async (data: any) => {
        const roomState = depsRef.current.roomState;
        const recording = depsRef.current.recording;
        const participantsHook = depsRef.current.participantsHook;

        joinStartedAtRef.current = null;
        publishFailureReportedRef.current = false;

        roomState.setIsJoining(false);
        roomState.setIsWaitingApproval(false);
        roomState.setIsPublished(true);
        roomState.setIsPlayed(true);

        recording.setIsRecordingActive(data.roomState.recording);

        participantsHook.setGuestsWaitingApproval(data.guestsWaitingApproval);

        console.log('inside user published', data.guestsWaitingApproval);

        const participants = data.participants;
        for (const [userId, _participant] of Object.entries(participants)) {
          const updatedParticipant = participants[userId];
          const participantMetaData = parseMetaData(updatedParticipant.metaData);
          updatedParticipant.name =
            participantMetaData[MetaDataKeys.NAME] || updatedParticipant.uid;
          updatedParticipant.isRaiseHand =
            participantMetaData[MetaDataKeys.IS_RAISED_HAND] || false;
          participants[userId] = updatedParticipant;
        }
        participantsHook.setParticipants(data.participants);

        for (const [userId, _participant] of Object.entries(participants)) {
          participantsHook.subscribeAttemptsRef.current[userId] = {
            retryCount: 0,
            inProgress: false,
          };
        }

        eventHandlersRef.current.subscribeToParticipants(data.participants);
      },

      webrtcIssuesDetected: (issues: any) => {
        if (depsRef.current.printStatLogsRef.current) {
          console.log('WebRTC Issues Detected:');
          // @ts-ignore
          issues.forEach((issue) => {
            console.log(`${issue.type}: ${issue.reason}`);
            console.log('Details:', issue.statsSample);
          });
        }
        depsRef.current.setCurrentIssues(issues);
      },

      updateDetailedStats: () => {
        if (client.conferenceClient.current && client.conferenceClient.current.isJoined) {
          const detailedStats = {};

          // Get publisher stats
          if (client.conferenceClient.current.streamName) {
            const publisherStats = client.conferenceClient.current.getConnectionStats(
              client.conferenceClient.current.streamName,
            );
            if (publisherStats.current) {
              // @ts-ignore
              detailedStats[client.conferenceClient.current.streamName] = {
                ...publisherStats.current,
                connectionType: 'publisher',
              };
            }
          }

          // Get subscriber stats
          client.conferenceClient.current.subscribers.forEach((_sub: any, userId: any) => {
            const subStats = client.conferenceClient.current.getConnectionStats(userId);
            if (subStats.current) {
              // @ts-ignore
              detailedStats[userId] = {
                ...subStats.current,
                connectionType: 'subscriber',
              };
            }
          });

          // Get screen share stats if active
          if (
            client.conferenceClient.current.isScreenSharing &&
            client.conferenceClient.current.streamName
          ) {
            const screenShareId = client.conferenceClient.current.streamName + '-screenshare';
            const screenStats = client.conferenceClient.current.getConnectionStats(screenShareId);
            if (screenStats.current) {
              // @ts-ignore
              detailedStats[screenShareId] = {
                ...screenStats.current,
                connectionType: 'screen-share-publisher',
              };
            }
          }

          depsRef.current.setConnectionStats(detailedStats);
        }
      },

      subscribeToParticipants: async (participantsObj: any) => {
        for (const [_userId, participant] of Object.entries(participantsObj)) {
          // @ts-ignore
          if (participant.role !== 'subscriber') {
            eventHandlersRef.current.subscribeToParticipant(participant);
          }
        }
      },

      subscribeToParticipant: async (participant: any) => {
        if (isNull(participant) || isNull(participant.uid)) return;

        const participantsHook = depsRef.current.participantsHook;

        try {
          if (participantsHook.subscribeAttemptsRef.current[participant.uid]?.inProgress) {
            log.warn(`Already attempting to subscribe to ${participant.uid}. Skipping...`);
            return;
          }
          // @ts-ignore
          if (
            participantsHook.subscribeAttemptsRef.current[participant.uid]?.retryCount >=
            sharedVariables.maxRetries
          ) {
            log.error(
              `Max subscription attempts reached for ${participant.uid}. Removing participant.`,
            );
            // Remove from participants (this will remove their video from DOM)
            // @ts-ignore
            participantsHook.setParticipants((prev) => {
              const newParticipants = { ...prev };
              delete newParticipants[participant.uid];
              return newParticipants;
            });

            log.log(
              `Removed participant ${participant.uid} from DOM due to repeated subscription failure`,
            );
            return;
          }

          console.log(`Subscribing to participant: ${participant.uid}`);

          participantsHook.subscribeAttemptsRef.current[participant.uid].inProgress = true;
          await client.subscribe(participant);
        } catch (error) {
          console.error(`Failed to subscribe to ${participant.uid}:`, error);
          participantsHook.subscribeAttemptsRef.current[participant.uid].inProgress = false;
          participantsHook.subscribeAttemptsRef.current[participant.uid].retryCount++;
          scheduleSubscribeRetry(
            participant,
            participantsHook.subscribeAttemptsRef.current[participant.uid].retryCount,
          );
        }
      },

      clearRemoteSubscriber: (streamId: any) => {
        const participantsHook = depsRef.current.participantsHook;
        const roomState = depsRef.current.roomState;
        const layoutRef = depsRef.current.layoutRef;
        const pinVideo = depsRef.current.pinVideo;
        const unpinVideo = depsRef.current.unpinVideo;

        if (
          participantsHook.pinnedParticipantIdRef.current &&
          streamId.localeCompare(participantsHook.pinnedParticipantIdRef.current) === 0
        ) {
          if (layoutRef.current === LayoutOptions.Sidebar) {
            pinVideo(roomState.streamNameRef.current);
          } else {
            unpinVideo(streamId);
          }
        }
      },
    };
  }

  useEffect(() => {
    if (!client.conferenceClient.current) return;

    const clientInstance = client.conferenceClient.current;

    if (clientInstance._eventsRegistered) return;

    const events: Record<string, (...args: any[]) => void> = {
      [ConferenceEvents.JOIN_FAILED]: eventHandlersRef.current.handleJoinFail,
      [ConferenceEvents.JOIN_BLOCKED]: eventHandlersRef.current.handleJoinBlock,
      [ConferenceEvents.PUBLISH_FAIL]: eventHandlersRef.current.handleJoinFail,
      [ConferenceEvents.PUBLISH_FAILED]: eventHandlersRef.current.handlePublishFailed,
      [ConferenceEvents.RECONNECTION_ATTEMPT]: eventHandlersRef.current.handleReconnectionAttempt,
      [ConferenceEvents.RECONNECTION_SUCCESS]: eventHandlersRef.current.handleReconnectionSuccess,
      [ConferenceEvents.RECONNECTION_FAILED]: eventHandlersRef.current.handleReconnectionFailed,
      [ConferenceEvents.RECONNECTION_ERROR]: eventHandlersRef.current.handleReconnectionError,
      [ConferenceEvents.USER_PUBLISHED]: eventHandlersRef.current.handleUserPublished,
      [ConferenceEvents.NEW_PARTICIPANT]: eventHandlersRef.current.handleNewParticipant,
      [ConferenceEvents.GUEST_JOIN_REQUEST]: eventHandlersRef.current.handleGuestJoinRequest,
      [ConferenceEvents.PARTICIPANT_DISCONNECTED]:
        eventHandlersRef.current.handleParticipantDisconnected,
      [ConferenceEvents.DATACHANNEL_AVAILABLE]: eventHandlersRef.current.handleDataChannelAvailable,
      [ConferenceEvents.SUBSCRIBE_SUCCESS]: eventHandlersRef.current.handleSubscribeSuccess,
      [ConferenceEvents.SUBSCRIBE_FAILED]: eventHandlersRef.current.handleSubscribeFailed,
      [ConferenceEvents.SUBSCRIBE_STOP]: eventHandlersRef.current.handleSubscribeStop,
      [ConferenceEvents.AUDIO_LEVEL]: eventHandlersRef.current.handleAudioLevel,
      [ConferenceEvents.AUDIO_MUTED]: eventHandlersRef.current.handleAudioMuted,
      [ConferenceEvents.VIDEO_MUTED]: eventHandlersRef.current.handleVideoMuted,
      [ConferenceEvents.PARTICIPANT_MEDIA_UPDATE]:
        eventHandlersRef.current.handleParticipantMediaUpdate,
      [ConferenceEvents.CONNECTION_CLOSED]: eventHandlersRef.current.handleConnectionClosed,
      [ConferenceEvents.CONNECT_FAIL]: eventHandlersRef.current.handleConnectFail,
      [ConferenceEvents.CHAT_MESSAGE]: (data: any) => depsRef.current.chat.handleChatMessage(data),
      [ConferenceEvents.SCREEN_SHARE_STARTED]: eventHandlersRef.current.handleScreenShareStarted,
      [ConferenceEvents.SCREEN_SHARE_STOPPED]: eventHandlersRef.current.handleScreenShareStopped,
      [ConferenceEvents.SCREEN_SHARE_FAILED]: eventHandlersRef.current.handleScreenShareFailed,
      [ConferenceEvents.ROOM_STATE_UPDATE]: eventHandlersRef.current.handleRoomStateUpdate,
      [ConferenceEvents.NETWORK_SCORES_UPDATED]:
        eventHandlersRef.current.handleNetworkScoresUpdated,
      [ConferenceEvents.WEBRTC_ISSUES_DETECTED]: eventHandlersRef.current.webrtcIssuesDetected,
      [ConferenceEvents.CONNECTION_STATE_CHANGED]:
        eventHandlersRef.current.handleConnectionStateChanged,
      [ConferenceEvents.CONNECTION_FAILED]: eventHandlersRef.current.handleConnectionFailed,
      [ConferenceEvents.VIRTUAL_BACKGROUND_INITIALIZED]:
        eventHandlersRef.current.handleEnableVirtualBackgroundControls,
      [ConferenceEvents.VIRTUAL_BACKGROUND_ENABLED]:
        eventHandlersRef.current.handleVirtualBackgroundEnabled,
      [ConferenceEvents.VIRTUAL_BACKGROUND_DISABLED]:
        eventHandlersRef.current.handleVirtualBackgroundDisabled,
      [ConferenceEvents.VIRTUAL_BACKGROUND_CHANGED]:
        eventHandlersRef.current.handleVirtualBackgroundChanged,
      [ConferenceEvents.VIRTUAL_BACKGROUND_ENABLE_FAILED]:
        eventHandlersRef.current.handleVirtualBackgroundEnableFailed,
      [ConferenceEvents.TRANSCRIPTION_RESULT]: eventHandlersRef.current.handleTranscriptionResult,
      [ConferenceEvents.LOCAL_RECORDING_ENABLED]:
        eventHandlersRef.current.handleLocalRecordingEnabled,
    };

    Object.entries(events).forEach(([event, handler]) => {
      clientInstance.on(event, handler);
    });

    clientInstance._eventsRegistered = true;
    console.log('Event listeners registered for client instance');

    return () => {
      console.log('Cleaning up event listeners');
      Object.entries(events).forEach(([event, handler]) => {
        clientInstance?.off(event, handler);
      });
      if (clientInstance) {
        clientInstance._eventsRegistered = false;
      }
    };
  }, [client.conferenceClient]);

  // Track join start for publish timeout watchdog
  useEffect(() => {
    const { isJoining, isPublished } = depsRef.current.roomState;
    if (isJoining && !isPublished) {
      if (!joinStartedAtRef.current) {
        joinStartedAtRef.current = Date.now();
        publishFailureReportedRef.current = false;
      }
    } else if (!isJoining) {
      joinStartedAtRef.current = null;
    }
  });

  // Internal health monitor when SDK events may not fire
  useEffect(() => {
    const interval = setInterval(() => {
      if (eventHandlersRef.current.checkStreamHealth) {
        eventHandlersRef.current.checkStreamHealth();
      }
    }, sharedVariables.healthCheckInterval);

    return () => {
      clearInterval(interval);
      Object.values(subscribeRetryTimersRef.current).forEach(clearTimeout);
      subscribeRetryTimersRef.current = {};
    };
  }, [client.conferenceClient]);
};
