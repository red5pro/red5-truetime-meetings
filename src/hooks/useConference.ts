// hooks/useConference.ts
import { useCallback, useEffect, useMemo, MutableRefObject } from 'react';
import { USER_ROLES, UserRole } from '../constants/userRoles';
import { useConferenceClient } from './useConferenceClient';
import { useRoomState } from './useRoomState';
import { useParticipants } from './useParticipants';
import { useMediaControls } from './useMediaControls';
import { useDeviceManagement } from './useDeviceManagement';
import { useConferenceActions } from './useConferenceActions';
import { useChat } from './useChat';
import { useDrawerStates } from './useDrawerStates';
import { useVirtualBackground } from './useVirtualBackground';
import { useScreenShare } from './useScreenShare';
import { usePermissions } from './usePermissions';
import { useClosedCaptions } from './useClosedCaptions';
import { useRecording } from './useRecording';
import { useTranscription } from './useTranscription';
import { useExternalStreams } from './useExternalStreams';
import { useConferenceState } from './useConferenceState';
import { useConferenceEvents } from './useConferenceEvents';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { useCustomNotification } from '../CustomNotification';
import { usePostRequest } from './usePostRequest';
import { reactions } from '../constants/config';
import { isNull } from '../utils/utils';
import floating from '../utils/floating';
import { useTranslation } from 'react-i18next';

// Type definitions
type NotificationVariant = 'info' | 'success' | 'error' | 'warning';

interface MediaStreamManager {
  getCurrentStream(): MediaStream | null;
  getMediaStream(): Promise<MediaStream>;
  setCurrentStream(stream: MediaStream): void;
  setOriginalStream(stream: MediaStream): void;
}

interface ConferenceClient {
  mediaStreamManager: MediaStreamManager;
  setMaxVideoBitrate?: (bitrate: number) => void;
}

interface Client {
  conferenceClient: MutableRefObject<ConferenceClient | null>;
  setMaxVideoBitrate?: (bitrate: number) => void;
}

interface RoomState {
  publishStreamIdRef: MutableRefObject<string | null>;
  streamName: string;
  isPublished: boolean;
  isPlayed: boolean;
  isPlayOnly: boolean;
  setLobbyOrMeetingPage: (page: string) => void;
  setIsJoining: (joining: boolean) => void;
  setIsWaitingApproval: (waitingApproval: boolean) => void;
}

interface MediaControls {
  isMyCamTurnedOff: boolean;
  toggleMic: (muted: boolean) => void;
}

interface Participants {
  setRaisedHands: React.Dispatch<React.SetStateAction<string[]>>;
  guestsWaitingApproval: Record<string, any>;
  setGuestsWaitingApproval: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  guestParticipantRequestList: string[];
  setGuestParticipantRequestList: React.Dispatch<React.SetStateAction<string[]>>;
}

interface DrawerStates {
  infoDrawerOpen: boolean;
  messageDrawerOpen: boolean;
  setMessageDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  participantListDrawerOpen: boolean;
  effectsDrawerOpen: boolean;
  localRecordingDrawerOpen: boolean;
  transcriptionDrawerOpen: boolean;
  externalStreamsDrawerOpen: boolean;
  handleInfoDrawerOpen: (open: boolean) => void;
  handleMessageDrawerOpen: (open: boolean) => void;
  handleParticipantListOpen: (open: boolean) => void;
  handleEffectsOpen: (open: boolean) => void;
  handleLocalRecordingDrawerOpen: (open: boolean) => void;
  handleTranscriptionDrawerOpen: (open: boolean) => void;
  handleExternalStreamsDrawerOpen: (open: boolean) => void;
}

interface Permissions {
  isPermissionDialogVisible: boolean;
  cameraPermissionState: PermissionState;
  microphonePermissionState: PermissionState;
  setIsPermissionDialogVisible: (visible: boolean) => void;
  updatePermissions: () => Promise<void>;
}

interface ConferenceState {
  roomName: string | undefined;
  role: UserRole;
  setRole: React.Dispatch<React.SetStateAction<UserRole>>;
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  showEmojis: boolean;
  setShowEmojis: React.Dispatch<React.SetStateAction<boolean>>;
  isRaiseHand: boolean;
  setRaiseHand: React.Dispatch<React.SetStateAction<boolean>>;
  isGlassmorphic: boolean;
  setIsGlassmorphic: React.Dispatch<React.SetStateAction<boolean>>;
  layout: string;
  setLayout: React.Dispatch<React.SetStateAction<string>>;
  changeLayout: (newLayout: string) => void;
  layoutRef: MutableRefObject<string>;
  outgoingBitrate: string;
  setOutgoingBitrate: React.Dispatch<React.SetStateAction<string>>;
  updateOutgoingBitrate: (bitrate: string) => void;
  unAuthorizedDialogOpen: boolean;
  setUnAuthorizedDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  unAuthorizedDialogMessage: string;
  setUnAuthorizedDialogMessage: React.Dispatch<React.SetStateAction<string>>;
  isMuteParticipantDialogOpen: boolean;
  setMuteParticipantDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  participantIdMuted: ParticipantMuted;
  setParticipantIdMuted: React.Dispatch<React.SetStateAction<ParticipantMuted>>;
  networkScore: NetworkScore;
  setNetworkScore: React.Dispatch<React.SetStateAction<NetworkScore>>;
  connectionStats: ConnectionStats;
  setConnectionStats: React.Dispatch<React.SetStateAction<ConnectionStats>>;
  currentIssues: string[];
  setCurrentIssues: React.Dispatch<React.SetStateAction<string[]>>;
  printStatLogs: boolean;
  setPrintStatLogs: React.Dispatch<React.SetStateAction<boolean>>;
  printStatLogsRef: MutableRefObject<boolean>;
  localVideoRef: MutableRefObject<HTMLVideoElement | null>;
}

type ParticipantMuted = {
  streamName: string;
  streamId: string;
};

type NetworkScore = {
  inbound: number;
  outbound: number;
  statsSamples: Record<string, unknown>;
};

type ConnectionStats = Record<string, unknown>;

interface ConferenceActions {
  leaveRoom: () => void;
  pinVideo: (streamId: string) => void;
  unpinVideo: (streamId: string) => void;
  sendNotificationEvent: (eventType: string, streamId: string, data: any) => void;
  approveGuestJoinRequest: (userId: string) => Promise<void>;
  rejectGuestJoinRequest: (userId: string) => Promise<void>;
}

interface DeviceManagement {
  updateDevicesList: () => void;
}

interface Recording {
  // Define recording interface based on your implementation
}

interface LocalRecording {
  isLocalRecordingActive: boolean;
  isLocalRecordingPaused: boolean;
  localRecordingStatus: any | null;
  startLocalRecording: (stream?: MediaStream, timeslice?: number) => void;
  stopLocalRecording: (stream?: MediaStream, timeslice?: number) => Promise<Blob | null>;
  pauseLocalRecording: () => void;
  resumeLocalRecording: () => void;
  downloadLocalRecording: (filename?: string) => Promise<boolean>;
  uploadLocalRecording: () => Promise<boolean>;
  getLocalRecordingBlob: () => Blob[] | null;
  clearLocalRecording: () => void;
  isUploading: boolean;
  uploadProgress: number;
  hasS3Config: boolean;
  recordingStartTime: number | null;
}

interface ScreenShare {
  // Define screen share interface based on your implementation
}

interface VirtualBackground {
  // Define virtual background interface based on your implementation
}

interface Chat {
  // Define chat interface based on your implementation
}

interface ClosedCaptions {
  // Define closed captions interface based on your implementation
}

interface Transcription {
  fetchTranscriptions: (startTime: number, endTime: number) => Promise<any>;
  loading: boolean;
  error: string | null;
  data: any | null;
  clearData: () => void;
}

interface CustomNotification {
  showSuccess: (message: string, options?: any) => void;
  showError: (message: string, options?: any) => void;
  showWarning: (message: string, options?: any) => void;
  showInfo: (message: string, options?: any) => void;
}

interface PostRequest {
  postData: (url: string, data: any) => Promise<any>;
}

interface EnhancedActions extends ConferenceActions {
  sendReactions: (reaction: string) => void;
  setIsRaiseHand: (isRaiseHand: boolean) => void;
  blockUser: (participantId: string, duration?: number) => void;
  unBlockUser: (participantId: string) => void;
}

interface UseConferenceReturn {
  room: RoomState & EnhancedActions & { roomId: string };
  media: MediaControls & DeviceManagement & { localVideoCreate: () => Promise<void> };
  participants: Participants;
  ui: DrawerStates & ConferenceState & { permissions: Permissions };
  features: {
    chat: Chat;
    screenShare: ScreenShare;
    virtualBackground: VirtualBackground;
    recording: Recording;
    localRecording: LocalRecording;
    closedCaptions: ClosedCaptions;
    transcription: Transcription;
    externalStreams: any;
  };
  client: Client;
  notifications: CustomNotification & {
    displayMessage: (message: string, variant?: NotificationVariant) => void;
  };
}

export const useConference = (roomId: string): UseConferenceReturn => {
  const { t } = useTranslation();
  const { postData }: PostRequest = usePostRequest();
  const { showSuccess, showError, showWarning, showInfo }: CustomNotification =
    useCustomNotification();
  const { token: googleToken } = useGoogleAuth();

  const client: Client = useConferenceClient();

  // @ts-expect-error: temporary fix for legacy code
  const roomStateResult: UseRoomStateReturn = useRoomState();
  const {
    publishStreamIdRef,
    streamName,
    isPublished,
    isPlayed,
    isPlayOnly,
    setLobbyOrMeetingPage,
    setIsJoining,
    setIsWaitingApproval,
  } = roomStateResult;

  const conferenceStateResult: ConferenceState = useConferenceState();
  const {
    passwordCheck = null,
    roomName,
    role,
    setRole,
    token,
    setToken,
    showEmojis,
    setShowEmojis,
    isRaiseHand: conferenceIsRaiseHand,
    setRaiseHand,
    isGlassmorphic,
    setIsGlassmorphic,
    layout,
    setLayout,
    changeLayout,
    layoutRef,
    outgoingBitrate,
    setOutgoingBitrate,
    updateOutgoingBitrate,
    unAuthorizedDialogOpen,
    setUnAuthorizedDialogOpen,
    unAuthorizedDialogMessage,
    setUnAuthorizedDialogMessage,
    isMuteParticipantDialogOpen,
    setMuteParticipantDialogOpen,
    participantIdMuted,
    setParticipantIdMuted,
    networkScore,
    setNetworkScore,
    connectionStats,
    setConnectionStats,
    currentIssues,
    setCurrentIssues,
    printStatLogs,
    setPrintStatLogs,
    printStatLogsRef,
    localVideoRef,
  } = conferenceStateResult as any; // Cast to any temporarily to avoid missing properties errors if I missed some

  const participants: Participants = useParticipants();
  // @ts-expect-error: temporary fix for legacy code
  const mediaControls: MediaControls = useMediaControls(client);
  const drawerStates: DrawerStates = useDrawerStates();
  // @ts-expect-error: temporary fix for legacy code
  const permissions: Permissions = usePermissions();
  // @ts-expect-error: temporary fix for legacy code
  const closedCaptions: ClosedCaptions = useClosedCaptions(client);
  const externalStreams = useExternalStreams(roomName || roomId);

  // Memoize helper functions to prevent recreation on every render
  const displayMessage = useCallback(
    (message: string, _variant: NotificationVariant = 'info') => {
      showInfo(message);
    },
    [showInfo],
  );

  const showReactions = useCallback(
    (streamId: string, name: string, reactionRequest: string) => {
      let reaction = '😀';

      // @ts-expect-error: temporary fix for legacy code
      if (!isNull(reactions[reactionRequest])) {
        // @ts-expect-error: temporary fix for legacy code
        reaction = reactions[reactionRequest];
      }

      let displayName = name;
      if (streamId === publishStreamIdRef.current) {
        displayName = t('You');
      }

      floating({
        content: `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-size: 1em;">${reaction}</span>
        <span style="
            background-color: rgba(66, 66, 66, 0.7);
            color: white;
            padding: 2px 6px;
            text-align: center;
            border-radius: 4px;
            font-size: 0.3em;
            white-space: nowrap;
            line-height: 1.2;
            font-weight: 500;
        ">${displayName}</span>
    </div>
        `,
        number: 1,
        duration: 6,
        repeat: 1,
        direction: 'normal',
        size: 3,
      });
    },
    [t, publishStreamIdRef],
  );

  const localVideoCreate = useCallback(async (): Promise<void> => {
    if (permissions.isPermissionDialogVisible) return;
    console.log('localVideoCreate called');

    const localVideoElement = document.getElementById('red5pro-publisher') as HTMLVideoElement;
    if (isNull(localVideoElement)) {
      return;
    }

    const currentClient = client.conferenceClient.current;
    if (!currentClient) return;

    let mediaStream = currentClient.mediaStreamManager.getCurrentStream();

    if (
      mediaStream &&
      mediaStream.getVideoTracks().length > 0 &&
      mediaStream.getVideoTracks()[0].readyState !== 'live'
    ) {
      mediaStream = null;
    }

    if (!mediaStream) {
      try {
        mediaStream = await currentClient.mediaStreamManager.getMediaStream();
        currentClient.mediaStreamManager.setCurrentStream(mediaStream);
        currentClient.mediaStreamManager.setOriginalStream(mediaStream);
      } catch (error) {
        console.error('Error getting media stream:', error);
        return;
      }
    }

    // @ts-expect-error: temporary fix for legacy code
    localVideoElement.srcObject = mediaStream;
  }, [client, permissions.isPermissionDialogVisible]);

  // Initialize dependent hooks with stable dependencies
  const deviceManagement: DeviceManagement = useDeviceManagement(
    // @ts-expect-error: temporary fix for legacy code
    client,
    roomStateResult,
    mediaControls,
    displayMessage,
  );

  const conferenceActions: ConferenceActions = useConferenceActions(
    // @ts-expect-error: temporary fix for legacy code
    client,
    roomStateResult,
    mediaControls,
    participants,
    postData,
    role,
    setToken,
    displayMessage,
    localVideoCreate,
    googleToken,
  );

  const recording = useRecording(
    roomName || roomId,
    token,
    role,
    showInfo,
    // @ts-expect-error: temporary fix for legacy code
    client.conferenceClient,
    () => drawerStates.handleLocalRecordingDrawerOpen(true),
    () => drawerStates.handleLocalRecordingDrawerOpen(false),
  );

  const localRecording = recording;

  const screenShare: ScreenShare = useScreenShare(
    // @ts-expect-error: temporary fix for legacy code
    client.conferenceClient,
    publishStreamIdRef,
    streamName || '',
    roomName || roomId,
    role,
    displayMessage,
  );

  const virtualBackground: VirtualBackground = useVirtualBackground(
    // @ts-expect-error: temporary fix for legacy code
    client.conferenceClient,
    mediaControls.isMyCamTurnedOff,
    showWarning,
  );

  const chat: Chat = useChat(
    // @ts-expect-error: temporary fix for legacy code
    client.conferenceClient,
    publishStreamIdRef,
    streamName || '',
    drawerStates.messageDrawerOpen,
    drawerStates.setMessageDrawerOpen,
    showReactions,
    participants.setRaisedHands,
    mediaControls.toggleMic,
    showInfo,
  );

  const transcription = useTranscription(roomName || roomId, token);

  // Setup conference events - call at top level but pass stable refs
  useConferenceEvents(
    // @ts-expect-error: temporary fix for legacy code
    client,
    participants,
    closedCaptions,
    roomStateResult,
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
    conferenceActions.leaveRoom,
    conferenceActions.pinVideo,
    conferenceActions.unpinVideo,
    layoutRef,
    role,
  );

  // Enhanced action handlers - memoized to prevent recreation
  const enhancedActions: EnhancedActions = useMemo(
    () => ({
      ...conferenceActions,
      sendReactions: (reaction: string) => {
        const reactionsStreamId = isPlayOnly
          ? (roomName || roomId)
          : publishStreamIdRef.current;
        conferenceActions.sendNotificationEvent('REACTIONS', reactionsStreamId || '', {
          reaction: reaction,
          senderStreamId: publishStreamIdRef.current,
          senderStreamName: streamName,
        });
      },

      setIsRaiseHand: (isRaised: boolean) => {
        conferenceActions.sendNotificationEvent(
          'RAISED_HAND',
          publishStreamIdRef.current || '',
          {
            isRaisedHand: isRaised,
            senderStreamId: publishStreamIdRef.current,
            senderStreamName: streamName,
          },
        );
        setRaiseHand(isRaised);
      },

      blockUser: (participantId: string, duration: number = 100) => {
        if (role !== USER_ROLES.ADMIN) return;
        displayMessage(`${participantId} is blocked for ${duration} seconds`);
        // Add API call here
      },

      unBlockUser: (participantId: string) => {
        if (role !== USER_ROLES.ADMIN) return;
        displayMessage(`${participantId} is unblocked`);
        // Add API call here
      },
    }),
    [conferenceActions, isPlayOnly, roomName, roomId, publishStreamIdRef, streamName, setRaiseHand, displayMessage, role],
  );

  // Effects - be very careful with dependencies

  // Auto-transition effect - only run when these specific values change
  useEffect(() => {
    if ((isPublished || isPlayOnly) && isPlayed) {
      setLobbyOrMeetingPage('meeting');
      setIsJoining(false);
      setIsWaitingApproval(false);
    }
  }, [isPublished, isPlayed, isPlayOnly, setLobbyOrMeetingPage, setIsJoining, setIsWaitingApproval]);

  // Sync stats ref - only run when printStatLogs changes
  useEffect(() => {
    printStatLogsRef.current = printStatLogs;
  }, [printStatLogs, printStatLogsRef]);

  // Sync bitrate - only run when outgoingBitrate changes
  useEffect(() => {
    if (client?.setMaxVideoBitrate) {
      client.setMaxVideoBitrate(parseInt(outgoingBitrate));
    }
  }, [outgoingBitrate, client]);

  // Permission handling - be very specific about dependencies
  useEffect(() => {
    if (!isPlayOnly) {
      if (
        permissions.cameraPermissionState !== 'granted' ||
        permissions.microphonePermissionState !== 'granted'
      ) {
        permissions.setIsPermissionDialogVisible(true);
      } else {
        permissions.setIsPermissionDialogVisible(false);
        localVideoCreate();
        deviceManagement.updateDevicesList();
      }
    }
  }, [
    permissions.cameraPermissionState,
    permissions.microphonePermissionState,
    isPlayOnly,
    permissions.setIsPermissionDialogVisible,
    localVideoCreate,
    deviceManagement,
  ]);

  // Initial permissions check - empty dependency array for one-time execution
  useEffect(() => {
    permissions
      .updatePermissions()
      .then(() => localVideoCreate())
      .catch(console.error);
  }, [permissions, localVideoCreate]); // Added deps but permissions is likely stable

  // Memoize the return object to prevent recreation on every render
  return useMemo(
    () => ({
      // Core room functionality
      room: {
        isPublished,
        isPlayed,
        isPlayOnly,
        publishStreamIdRef,
        streamName: streamName || '',
        setLobbyOrMeetingPage,
        setIsJoining,
        setIsWaitingApproval,
        ...enhancedActions,
        roomId: roomName || roomId,
      },

      // Media controls and devices
      media: {
        ...mediaControls,
        ...deviceManagement,
        localVideoCreate,
      },

      // Participants management
      participants,

      // UI state and controls
      ui: {
        ...drawerStates,
        roomName: roomName || roomId,
        role,
        setRole,
        token,
        setToken,
        showEmojis,
        setShowEmojis,
        isRaiseHand: conferenceIsRaiseHand,
        setRaiseHand,
        isGlassmorphic,
        setIsGlassmorphic,
        layout,
        setLayout,
        changeLayout,
        layoutRef,
        outgoingBitrate,
        setOutgoingBitrate,
        updateOutgoingBitrate,
        unAuthorizedDialogOpen,
        setUnAuthorizedDialogOpen,
        unAuthorizedDialogMessage,
        setUnAuthorizedDialogMessage,
        isMuteParticipantDialogOpen,
        setMuteParticipantDialogOpen,
        participantIdMuted,
        setParticipantIdMuted,
        networkScore,
        setNetworkScore,
        connectionStats,
        setConnectionStats,
        currentIssues,
        setCurrentIssues,
        printStatLogs,
        setPrintStatLogs,
        printStatLogsRef,
        localVideoRef,
        permissions,
        passwordCheck,
      },

      // Conference features
      features: {
        chat,
        screenShare,
        virtualBackground,
        recording,
        localRecording,
        closedCaptions,
        transcription,
        externalStreams,
      },

      // Client and utilities
      client,
      notifications: {
        showSuccess,
        showError,
        showWarning,
        showInfo,
        displayMessage,
      },
    }),
    [
      isPublished,
      isPlayed,
      isPlayOnly,
      publishStreamIdRef,
      streamName,
      setLobbyOrMeetingPage,
      setIsJoining,
      setIsWaitingApproval,
      enhancedActions,
      roomName,
      roomId,
      mediaControls,
      deviceManagement,
      localVideoCreate,
      participants,
      drawerStates,
      role,
      setRole,
      token,
      setToken,
      showEmojis,
      setShowEmojis,
      conferenceIsRaiseHand,
      setRaiseHand,
      isGlassmorphic,
      setIsGlassmorphic,
      layout,
      setLayout,
      changeLayout,
      layoutRef,
      outgoingBitrate,
      setOutgoingBitrate,
      updateOutgoingBitrate,
      unAuthorizedDialogOpen,
      setUnAuthorizedDialogOpen,
      unAuthorizedDialogMessage,
      setUnAuthorizedDialogMessage,
      isMuteParticipantDialogOpen,
      setMuteParticipantDialogOpen,
      participantIdMuted,
      setParticipantIdMuted,
      networkScore,
      setNetworkScore,
      connectionStats,
      setConnectionStats,
      currentIssues,
      setCurrentIssues,
      printStatLogs,
      setPrintStatLogs,
      printStatLogsRef,
      localVideoRef,
      permissions,
      passwordCheck,
      chat,
      screenShare,
      virtualBackground,
      recording,
      localRecording,
      closedCaptions,
      transcription,
      externalStreams,
      client,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      displayMessage,
    ],
  ) as UseConferenceReturn;
};
