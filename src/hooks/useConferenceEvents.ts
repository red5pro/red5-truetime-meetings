// hooks/useConferenceEvents.ts
import { ConferenceEvents } from 'red5pro-conference-sdk';
import { useEffect, useRef } from 'react';
import { isNull, parseMetaData } from '../utils/utils';
import { MetaDataKeys } from '../constants/metaDataKeys';
import log from 'loglevel';
import globals from 'globals';
import { LayoutOptions } from '../utils/layoutOptions';
import { useDataChannelHeartbeat } from './useDataChannelHeartbeat';

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
  subscribeAttemptsRef: React.MutableRefObject<
    Record<string, { retryCount: number; inProgress: boolean }>
  >;
  talkerAudioLevelsRef: React.MutableRefObject<Record<string, any>>;
  pinnedParticipantIdRef: React.MutableRefObject<string | null>;
  guestsWaitingApproval?: Record<string, any>;
  setGuestsWaitingApproval: (participants: Record<string, any>) => void;
};

type RoomState = {
  setIsJoining: (val: boolean) => void;
  setIsWaitingApproval: (val: boolean) => void;
  setIsPublished: (val: boolean) => void;
  setIsPlayed: (val: boolean) => void;
  setLobbyOrMeetingPage: (page: 'lobby' | 'meeting') => void;
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
  const { startHeartbeat, stopHeartbeat, sendHeartbeat } = useDataChannelHeartbeat(
    client.conferenceClient,
  );
  const heartbeatControlRef = useRef({ startHeartbeat, stopHeartbeat, sendHeartbeat });

  heartbeatControlRef.current = { startHeartbeat, stopHeartbeat, sendHeartbeat };

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

  if (!eventHandlersRef.current.initialized) {
    eventHandlersRef.current = {
      initialized: true,

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
        heartbeatControlRef.current.sendHeartbeat();
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
        heartbeatControlRef.current.stopHeartbeat();
        depsRef.current.roomState.setIsJoining(false);
        depsRef.current.roomState.setIsWaitingApproval(false);
        depsRef.current.displayMessage('Failed to join: Connection failed');
      },

      handleConnectionClosed: () => {
        log.log('Connection closed');
        heartbeatControlRef.current.stopHeartbeat();
        depsRef.current.displayMessage('Connection closed');
        depsRef.current
          .handleLeaveFromRoom()
          .then(() => depsRef.current.roomState.setLobbyOrMeetingPage('lobby'));
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

        // @ts-ignore
        log.warn(
          `Subscription failed for ${data.user.uid}. Attempt ${participantsHook.subscribeAttemptsRef.current[data.user.uid].retryCount}/${globals.maxRetries}. Will retry on next opportunity.`,
        );

        eventHandlersRef.current.subscribeToParticipant(data.user);
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
        heartbeatControlRef.current.startHeartbeat();
      },

      handleJoinFail: async (data: any) => {
        if (depsRef.current.role === 'guest') {
          return;
        }

        log.log('Join fail:', data);

        depsRef.current
          .handleLeaveFromRoom()
          .then(() => console.log('handleLeaveFromRoom due to join fail'));

        if (data.statusCode === 401) {
          depsRef.current.roomState.setIsJoining(false);
          depsRef.current.roomState.setIsWaitingApproval(false);
          depsRef.current.setUnAuthorizedDialogMessage(
            'Publish failed, due to an error. Please try again.',
          );
          depsRef.current.setUnAuthorizedDialogOpen(true);
        }
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
        heartbeatControlRef.current.startHeartbeat();
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
            globals.maxRetries
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
};
