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
  closedCaptions: { addCaption: (data: any) => void },
  roomState: RoomState,
  mediaControls: { isMyCamTurnedOff: boolean; isMyMicMuted: boolean },
  chat: { handleChatMessage: (data: any) => void },
  screenShare: ScreenShare,
  virtualBackground: any,
  recording: Recording,
  localRecording: { startLocalRecording: () => void; stopLocalRecording: () => void },
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
  const { conferenceClient, subscribe } = client;
  const {
    participants,
    setParticipants,
    setSubscribedParticipants,
    updateTalkerLevel,
    clearParticipant,
    subscribeAttemptsRef,
    talkerAudioLevelsRef,
    pinnedParticipantIdRef,
    guestsWaitingApproval,
    setGuestsWaitingApproval,
  } = participantsHook;

  const {
    setIsJoining,
    setIsWaitingApproval,
    setIsPublished,
    setIsPlayed,
    setLobbyOrMeetingPage,
    publishStreamIdRef,
    streamNameRef,
  } = roomState;

  const {
    setIsScreenShared,
    setIsStartingScreenShare,
    showScreenShareSpinner,
  } = screenShare;

  const {
    setIsRecordingActive,
  } = recording;

  // Store all dependencies in a ref to avoid closure issues
  const depsRef = useRef<any>({});

  depsRef.current = {
    participants,
    setParticipants,
    setSubscribedParticipants,
    updateTalkerLevel,
    clearParticipant,
    subscribeAttemptsRef,
    talkerAudioLevelsRef,
    pinnedParticipantIdRef,
    guestsWaitingApproval,
    setGuestsWaitingApproval,
    closedCaptions,
    setIsJoining,
    setIsWaitingApproval,
    setIsPublished,
    setIsPlayed,
    setLobbyOrMeetingPage,
    publishStreamIdRef,
    streamNameRef,
    mediaControls,
    chat,
    setIsScreenShared,
    setIsStartingScreenShare,
    showScreenShareSpinner,
    virtualBackground,
    setIsRecordingActive,
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
        console.log('Transcription data', data, depsRef.current.participants);
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
        if (data.stream && conferenceClient.current) {
          conferenceClient.current.mediaStreamManager.setScreenShareStream(data.stream);
        }
        depsRef.current.setIsScreenShared(true);
        depsRef.current.setIsStartingScreenShare(false);
      },

      handleScreenShareStopped: () => {
        log.log('Screen share stopped');
        depsRef.current.displayMessage('Screen sharing has ended.');
        if (conferenceClient.current) {
          conferenceClient.current.mediaStreamManager.setScreenShareStream(null);
        }
        depsRef.current.setIsScreenShared(false);
        depsRef.current.setIsStartingScreenShare(false);
        depsRef.current.showScreenShareSpinner.current = false;
      },

      handleScreenShareFailed: (data: any) => {
        log.log('Screen share is failed:', data);
        if (conferenceClient.current) {
          conferenceClient.current.mediaStreamManager.setScreenShareStream(null);
        }
        depsRef.current.setIsScreenShared(false);
        depsRef.current.setIsStartingScreenShare(false);
        depsRef.current.showScreenShareSpinner.current = false;
      },

      handleConnectFail: () => {
        log.log('Connect fail');
        depsRef.current.setIsJoining(false);
        depsRef.current.setIsWaitingApproval(false);
        depsRef.current.displayMessage('Failed to join: Connection failed');
      },

      handleConnectionClosed: () => {
        log.log('Connection closed');
        depsRef.current.displayMessage('Connection closed');
        depsRef.current
          .handleLeaveFromRoom()
          .then(() => depsRef.current.setLobbyOrMeetingPage('lobby'));
      },

      handleSubscribeFailed: (data: any) => {
        log.error('Subscribe failed:', data.user.uid, data.error);

        if (isNull(data.user.uid)) return;

        const subAttemptsRef = depsRef.current.subscribeAttemptsRef;

        if (!subAttemptsRef.current[data.user.uid]) {
          subAttemptsRef.current[data.user.uid] = {
            retryCount: 0,
            inProgress: false,
          };
        }

        subAttemptsRef.current[data.user.uid].retryCount++;
        subAttemptsRef.current[data.user.uid].inProgress = false;

        log.warn(
          `Subscription failed for ${data.user.uid}. Attempt ${subAttemptsRef.current[data.user.uid].retryCount}/${sharedVariables.maxRetries}. Will retry on next opportunity.`,
        );

        eventHandlersRef.current.subscribeToParticipant(data.user);
      },

      handleAudioLevel: (data: any) => {
        depsRef.current.updateTalkerLevel(data.userId, data.level.normalized);
      },

      handleSubscribeStop: (data: any) => {
        console.log('handleSubscribeStop', data);
        eventHandlersRef.current.clearRemoteSubscriber(data.uid);
        depsRef.current.clearParticipant(data.uid);
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

        depsRef.current
          .handleLeaveFromRoom()
          .then(() => console.log('handleLeaveFromRoom due to join fail'));

        if (data.statusCode === 401) {
          depsRef.current.setIsJoining(false);
          depsRef.current.setIsWaitingApproval(false);
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

        depsRef.current.setIsJoining(false);
        depsRef.current.setIsWaitingApproval(false);
        depsRef.current.setUnAuthorizedDialogMessage(errorMessage);
        depsRef.current.setUnAuthorizedDialogOpen(true);
      },

      handleParticipantMediaUpdate: (data: any) => {
        log.log('Participant media update:', data);
        const { streamName: sName, videoEnabled, audioEnabled } = data;

        console.log('Participant media update', depsRef.current.participants);

        // Update main participants
        depsRef.current.setParticipants((prevParticipants: Record<string, any>) => ({
          ...prevParticipants,
          [sName]: {
            ...prevParticipants[sName],
            videoEnabled,
            audioEnabled,
          },
        }));

        // Update subscribedParticipants if the participant exists
        depsRef.current.setSubscribedParticipants((prev: Record<string, any>) => {
          const existing = prev[sName];
          if (!existing) return prev;

          return {
            ...prev,
            [sName]: {
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

        const subAttemptsRef = depsRef.current.subscribeAttemptsRef;
        const pStreamIdRef = depsRef.current.publishStreamIdRef;
        const spinnerRef = depsRef.current.showScreenShareSpinner;
        const dMessage = depsRef.current.displayMessage;
        const pVideo = depsRef.current.pinVideo;

        subAttemptsRef.current[data.uid] = {
          retryCount: 0,
          inProgress: false,
        };

        depsRef.current.setSubscribedParticipants((prev: Record<string, any>) => ({
          ...prev,
          [data.uid]: {
            participant: data.participant,
            mediaStream: data.mediaStream,
          },
        }));

        if (data.participant.metaData === 'external-stream') {
          pVideo(data.uid);
          return;
        }

        const metaData = parseMetaData(data.participant.metaData);

        if (metaData[MetaDataKeys.IS_SCREEN_SHARING] === true) {
          pVideo(data.uid);
        }

        if (
          metaData[MetaDataKeys.IS_SCREEN_SHARING] === true &&
          metaData[MetaDataKeys.OWNER_STREAM_ID] === pStreamIdRef.current
        ) {
          spinnerRef.current = false;
        } else if (metaData[MetaDataKeys.IS_SCREEN_SHARING] === true) {
          dMessage(metaData[MetaDataKeys.OWNER_NAME] + ' is sharing their screen.');
        }
      },

      handleRoomStateUpdate: (data: any) => {
        console.log('handleRoomStateUpdate', data);
        depsRef.current.setIsRecordingActive(data.roomState.recording);
        if (data.roomState.localRecordingEnabled) {
          depsRef.current.localRecording.startLocalRecording();
        } else if (
          data.roomState.localRecordingEnabled === false &&
          depsRef.current.localRecording.isLocalRecordingActive
        ) {
          depsRef.current.localRecording.stopLocalRecording();
        }
      },

      handleGuestJoinRequest: (data: any) => {
        console.log('handleGuestJoinRequest', data);
        const guestsWaitApproval = { ...(depsRef.current.guestsWaitingApproval || {}) };
        guestsWaitApproval[data.streamName] = {
          streamId: data.streamName,
          name: data.streamName,
          streamName: data.streamName,
        };
        depsRef.current.setGuestsWaitingApproval(guestsWaitApproval);

        depsRef.current.displayMessage(`${data.streamName} requested to join the room`);
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

        depsRef.current.setParticipants((prev: Record<string, any>) => ({
          ...prev,
          [newParticipant.uid]: newParticipant,
        }));

        log.log('participants', depsRef.current.participants);

        depsRef.current.subscribeAttemptsRef.current[newParticipant.uid] = {
          retryCount: 0,
          inProgress: false,
        };

        if (newParticipant.role !== 'subscriber') {
          setTimeout(async () => {
            await eventHandlersRef.current.subscribeToParticipant(newParticipant);
          }, 3000);
        }
      },

      handleParticipantDisconnected: (data: any) => {
        log.log('Participant disconnected:', data.participant);

        eventHandlersRef.current.clearRemoteSubscriber(data.participant.uid);

        // Remove from participants
        depsRef.current.setParticipants((prev: Record<string, any>) => {
          const newParticipants = { ...prev };
          delete newParticipants[data.participant.uid];
          return newParticipants;
        });

        depsRef.current.setSubscribedParticipants((prev: Record<string, any>) => {
          const newSubscribed = { ...prev };
          delete newSubscribed[data.participant.uid];
          return newSubscribed;
        });

        // Remove audio level for disconnected participant
        const newTalkers = { ...depsRef.current.talkerAudioLevelsRef.current };
        delete newTalkers[data.participant.uid];
        depsRef.current.talkerAudioLevelsRef.current = newTalkers;
      },

      handleUserPublished: async (data: any) => {
        depsRef.current.setIsJoining(false);
        depsRef.current.setIsWaitingApproval(false);
        depsRef.current.setIsPublished(true);
        depsRef.current.setIsPlayed(true);

        depsRef.current.setIsRecordingActive(data.roomState.recording);

        depsRef.current.setGuestsWaitingApproval(data.guestsWaitingApproval);

        console.log('inside user published', data.guestsWaitingApproval);

        const parts = data.participants;
        for (const [userId, _participant] of Object.entries(parts)) {
          const updatedParticipant = parts[userId] as any;
          const participantMetaData = parseMetaData(updatedParticipant.metaData);
          updatedParticipant.name =
            participantMetaData[MetaDataKeys.NAME] || updatedParticipant.uid;
          updatedParticipant.isRaiseHand =
            participantMetaData[MetaDataKeys.IS_RAISED_HAND] || false;
          parts[userId] = updatedParticipant;
        }
        depsRef.current.setParticipants(parts);

        for (const [userId, _participant] of Object.entries(parts)) {
          depsRef.current.subscribeAttemptsRef.current[userId] = {
            retryCount: 0,
            inProgress: false,
          };
        }

        await eventHandlersRef.current.subscribeToParticipants(parts);
      },

      webrtcIssuesDetected: (issues: any) => {
        if (depsRef.current.printStatLogsRef.current) {
          console.log('WebRTC Issues Detected:');
          issues.forEach((issue: any) => {
            console.log(`${issue.type}: ${issue.reason}`);
            console.log('Details:', issue.statsSample);
          });
        }
        depsRef.current.setCurrentIssues(issues);
      },

      updateDetailedStats: () => {
        if (conferenceClient.current && conferenceClient.current.isJoined) {
          const detailedStats = {} as any;

          // Get publisher stats
          if (conferenceClient.current.streamName) {
            const publisherStats = conferenceClient.current.getConnectionStats(
              conferenceClient.current.streamName,
            );
            if (publisherStats.current) {
              detailedStats[conferenceClient.current.streamName] = {
                ...publisherStats.current,
                connectionType: 'publisher',
              };
            }
          }

          // Get subscriber stats
          conferenceClient.current.subscribers.forEach((_sub: any, userId: any) => {
            const subStats = conferenceClient.current.getConnectionStats(userId);
            if (subStats.current) {
              detailedStats[userId] = {
                ...subStats.current,
                connectionType: 'subscriber',
              };
            }
          });

          // Get screen share stats if active
          if (
            conferenceClient.current.isScreenSharing &&
            conferenceClient.current.streamName
          ) {
            const screenShareId = conferenceClient.current.streamName + '-screenshare';
            const screenStats = conferenceClient.current.getConnectionStats(screenShareId);
            if (screenStats.current) {
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
          if ((participant as any).role !== 'subscriber') {
            await eventHandlersRef.current.subscribeToParticipant(participant);
          }
        }
      },

      subscribeToParticipant: async (participant: any) => {
        if (isNull(participant) || isNull(participant.uid)) return;

        const subAttemptsRef = depsRef.current.subscribeAttemptsRef;

        try {
          if (subAttemptsRef.current[participant.uid]?.inProgress) {
            log.warn(`Already attempting to subscribe to ${participant.uid}. Skipping...`);
            return;
          }
          if (
            subAttemptsRef.current[participant.uid]?.retryCount >=
            sharedVariables.maxRetries
          ) {
            log.error(
              `Max subscription attempts reached for ${participant.uid}. Removing participant.`,
            );
            // Remove from participants (this will remove their video from DOM)
            depsRef.current.setParticipants((prev: Record<string, any>) => {
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

          subAttemptsRef.current[participant.uid].inProgress = true;
          await subscribe(participant);
        } catch (error) {
          console.error(`Failed to subscribe to ${participant.uid}:`, error);
        }
      },

      clearRemoteSubscriber: (streamId: any) => {
        const pParticipantIdRef = depsRef.current.pinnedParticipantIdRef;
        const sNameRef = depsRef.current.streamNameRef;
        const lRef = depsRef.current.layoutRef;
        const pVideo = depsRef.current.pinVideo;
        const uVideo = depsRef.current.unpinVideo;

        if (
          pParticipantIdRef.current &&
          streamId.localeCompare(pParticipantIdRef.current) === 0
        ) {
          if (lRef.current === LayoutOptions.Sidebar) {
            pVideo(sNameRef.current);
          } else {
            uVideo(streamId);
          }
        }
      },
    };
  }

  useEffect(() => {
    if (!conferenceClient.current) return;

    const clientInstance = conferenceClient.current as any;

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
  }, [conferenceClient, subscribe]);
};
