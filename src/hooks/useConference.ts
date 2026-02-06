// hooks/useConference.ts
import { useCallback, useEffect, useMemo, MutableRefObject } from 'react';
import { USER_ROLES, UserRole } from "../constants/userRoles";
import { useConferenceClient } from "./useConferenceClient";
import { useRoomState } from "./useRoomState";
import { useParticipants } from "./useParticipants";
import { useMediaControls } from "./useMediaControls";
import { useDeviceManagement } from "./useDeviceManagement";
import { useConferenceActions } from "./useConferenceActions";
import { useChat } from "./useChat";
import { useDrawerStates } from "./useDrawerStates";
import { useVirtualBackground } from "./useVirtualBackground";
import { useScreenShare } from "./useScreenShare";
import { usePermissions } from "./usePermissions";
import { useClosedCaptions } from "./useClosedCaptions";
import { useRecording } from "./useRecording";
import { useTranscription } from "./useTranscription";
import { useConferenceState } from "./useConferenceState";
import { useConferenceEvents } from "./useConferenceEvents";
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { useCustomNotification } from '../CustomNotification';
import { usePostRequest } from './usePostRequest';
import { peerConfig, reactions } from "../constants/config";
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
    handleInfoDrawerOpen: (open: boolean) => void;
    handleMessageDrawerOpen: (open: boolean) => void;
    handleParticipantListOpen: (open: boolean) => void;
    handleEffectsOpen: (open: boolean) => void;
    handleLocalRecordingDrawerOpen: (open: boolean) => void;
}

interface Permissions {
    isPermissionDialogVisible: boolean;
    cameraPermissionState: PermissionState;
    microphonePermissionState: PermissionState;
    setIsPermissionDialogVisible: (visible: boolean) => void;
    updatePermissions: () => Promise<void>;
}

interface ConferenceState {
    roomName: string;
    token: string;
    role: UserRole;
    setToken: (token: string) => void;
    printStatLogs: boolean;
    printStatLogsRef: MutableRefObject<boolean>;
    outgoingBitrate: string;
    setNetworkScore: (score: number) => void;
    setConnectionStats: (stats: any) => void;
    setCurrentIssues: (issues: any) => void;
    setUnAuthorizedDialogMessage: (message: string) => void;
    setUnAuthorizedDialogOpen: (open: boolean) => void;
    setRaiseHand: (raised: boolean) => void;
    layoutRef: MutableRefObject<any>;
}

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
    stopLocalRecording: () => Blob | null;
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
    };
    client: Client;
    notifications: CustomNotification & {
        displayMessage: (message: string, variant?: NotificationVariant) => void;
    };
}

export const useConference = (roomId: string): UseConferenceReturn => {
    const { t } = useTranslation();
    const { postData }: PostRequest = usePostRequest();
    const { showSuccess, showError, showWarning, showInfo }: CustomNotification = useCustomNotification();
    const { token: googleToken } = useGoogleAuth();

    // Initialize core hooks ONCE
    // @ts-ignore
    const client: Client = useConferenceClient(peerConfig);
    // @ts-ignore
    const conferenceState: ConferenceState = useConferenceState(roomId);
    // @ts-ignore
    const roomState: RoomState = useRoomState();
    const participants: Participants = useParticipants();
    // @ts-ignore
    const mediaControls: MediaControls = useMediaControls(client);
    const drawerStates: DrawerStates = useDrawerStates();
    // @ts-ignore
    const permissions: Permissions = usePermissions();
    // @ts-ignore
    const closedCaptions: ClosedCaptions = useClosedCaptions(client);

    // Memoize helper functions to prevent recreation on every render
    const displayMessage = useCallback((message: string, _variant: NotificationVariant = 'info') => {
        showInfo(message);
    }, [showInfo]);

    const showReactions = useCallback((streamId: string, streamName: string, reactionRequest: string) => {
        let reaction = '😀';

        // @ts-ignore
        if (!isNull(reactions[reactionRequest])) {
            // @ts-ignore
            reaction = reactions[reactionRequest];
        }

        if (streamId === roomState.publishStreamIdRef.current) {
            streamName = t('You');
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
            ">${streamName}</span>
        </div>
    `,
            number: 1,
            duration: 6,
            repeat: 1,
            direction: 'normal',
            size: 3
        });
    }, [t, roomState.publishStreamIdRef]);

    const localVideoCreate = useCallback(async (): Promise<void> => {
        if (permissions.isPermissionDialogVisible) return;
        console.log("localVideoCreate called");

        const localVideoElement = document.getElementById('red5pro-publisher') as HTMLVideoElement;
        if (isNull(localVideoElement)) {
            return;
        }

        const currentClient = client.conferenceClient.current;
        if (!currentClient) return;

        let mediaStream = currentClient.mediaStreamManager.getCurrentStream();

        if (mediaStream && mediaStream.getVideoTracks().length > 0 && mediaStream.getVideoTracks()[0].readyState !== 'live') {
            mediaStream = null;
        }

        if (!mediaStream) {
            try {
                mediaStream = await currentClient.mediaStreamManager.getMediaStream();
                currentClient.mediaStreamManager.setCurrentStream(mediaStream);
                currentClient.mediaStreamManager.setOriginalStream(mediaStream);
            } catch (error) {
                console.error("Error getting media stream:", error);
                return;
            }
        }

        // @ts-ignore
        localVideoElement.srcObject = mediaStream;
    }, [client, permissions.isPermissionDialogVisible]);

    // Initialize dependent hooks with stable dependencies
    const deviceManagement: DeviceManagement = useDeviceManagement(
        // @ts-ignore
        client,
        roomState,
        mediaControls,
        displayMessage
    );

    const conferenceActions: ConferenceActions = useConferenceActions(
        // @ts-ignore
        client,
        roomState,
        mediaControls,
        participants,
        postData,
        conferenceState.role,
        conferenceState.setToken,
        displayMessage,
        localVideoCreate,
        googleToken
    );

    const recording = useRecording(
        conferenceState.roomName,
        conferenceState.token,
        conferenceState.role,
        showInfo,
        // @ts-ignore
        client.conferenceClient,
        () => drawerStates.handleLocalRecordingDrawerOpen(true),
        () => drawerStates.handleLocalRecordingDrawerOpen(false)
    );

    const localRecording = recording;

    const screenShare: ScreenShare = useScreenShare(
        // @ts-ignore
        client.conferenceClient,
        roomState.publishStreamIdRef,
        roomState.streamName,
        conferenceState.roomName,
        conferenceState.role,
        displayMessage
    );

    const virtualBackground: VirtualBackground = useVirtualBackground(
        // @ts-ignore
        client.conferenceClient,
        mediaControls.isMyCamTurnedOff,
        showWarning
    );

    const chat: Chat = useChat(
        // @ts-ignore
        client.conferenceClient,
        roomState.publishStreamIdRef,
        roomState.streamName,
        drawerStates.messageDrawerOpen,
        drawerStates.setMessageDrawerOpen,
        showReactions,
        participants.setRaisedHands,
        mediaControls.toggleMic,
        showInfo
    );

    const transcription = useTranscription(conferenceState.roomName, conferenceState.token);

    // Setup conference events - call at top level but pass stable refs
    useConferenceEvents(
        // @ts-ignore
        client,
        participants,
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
        conferenceState.setNetworkScore,
        conferenceState.setConnectionStats,
        conferenceState.setCurrentIssues,
        conferenceState.printStatLogsRef,
        conferenceState.setUnAuthorizedDialogMessage,
        conferenceState.setUnAuthorizedDialogOpen,
        conferenceActions.leaveRoom,
        conferenceActions.pinVideo,
        conferenceActions.unpinVideo,
        conferenceState.layoutRef,
        conferenceState.role
    );

    // Enhanced action handlers - memoized to prevent recreation
    const enhancedActions: EnhancedActions = useMemo(() => ({
        ...conferenceActions,
        sendReactions: (reaction: string) => {
            const reactionsStreamId = roomState.isPlayOnly ? conferenceState.roomName : roomState.publishStreamIdRef.current;
            conferenceActions.sendNotificationEvent('REACTIONS', reactionsStreamId || '', {
                reaction: reaction,
                senderStreamId: roomState.publishStreamIdRef.current,
                senderStreamName: roomState.streamName
            });
        },

        setIsRaiseHand: (isRaiseHand: boolean) => {
            conferenceActions.sendNotificationEvent('RAISED_HAND', roomState.publishStreamIdRef.current || '', {
                isRaisedHand: isRaiseHand,
                senderStreamId: roomState.publishStreamIdRef.current,
                senderStreamName: roomState.streamName
            });
            conferenceState.setRaiseHand(isRaiseHand);
        },

        blockUser: (participantId: string, duration: number = 100) => {
            if (conferenceState.role !== USER_ROLES.ADMIN) return;
            displayMessage(`${participantId} is blocked for ${duration} seconds`);
            // Add API call here
        },

        unBlockUser: (participantId: string) => {
            if (conferenceState.role !== USER_ROLES.ADMIN) return;
            displayMessage(`${participantId} is unblocked`);
            // Add API call here
        }
    }), [conferenceActions, roomState, conferenceState, displayMessage]);

    // Effects - be very careful with dependencies

    // Auto-transition effect - only run when these specific values change
    useEffect(() => {
        if ((roomState.isPublished || roomState.isPlayOnly) && roomState.isPlayed) {
            roomState.setLobbyOrMeetingPage('meeting');
            roomState.setIsJoining(false);
            roomState.setIsWaitingApproval(false);
        }
    }, [roomState.isPublished, roomState.isPlayed, roomState.isPlayOnly]);

    // Sync stats ref - only run when printStatLogs changes
    useEffect(() => {
        conferenceState.printStatLogsRef.current = conferenceState.printStatLogs;
    }, [conferenceState.printStatLogs]);

    // Sync bitrate - only run when outgoingBitrate changes
    useEffect(() => {
        if (client?.setMaxVideoBitrate) {
            client.setMaxVideoBitrate(parseInt(conferenceState.outgoingBitrate));
        }
    }, [conferenceState.outgoingBitrate]);

    // Permission handling - be very specific about dependencies
    useEffect(() => {
        if (!roomState.isPlayOnly) {
            if (permissions.cameraPermissionState !== 'granted' || permissions.microphonePermissionState !== 'granted') {
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
        roomState.isPlayOnly,
    ]);

    // Initial permissions check - empty dependency array for one-time execution
    useEffect(() => {
        permissions.updatePermissions()
            .then(() => localVideoCreate())
            .catch(console.error);
    }, []); // Empty deps - run only once

    // Memoize the return object to prevent recreation on every render
    return useMemo(() => ({
        // Core room functionality
        room: {
            ...roomState,
            ...enhancedActions,
            roomId: conferenceState.roomName
        },

        // Media controls and devices
        media: {
            ...mediaControls,
            ...deviceManagement,
            localVideoCreate
        },

        // Participants management
        participants,

        // UI state and controls
        ui: {
            ...drawerStates,
            ...conferenceState,
            permissions
        },

        // Conference features
        features: {
            chat,
            screenShare,
            virtualBackground,
            recording,
            localRecording,
            closedCaptions,
            transcription
        },

        // Client and utilities
        client,
        notifications: {
            showSuccess,
            showError,
            showWarning,
            showInfo,
            displayMessage
        }
    }), [
        roomState,
        enhancedActions,
        conferenceState,
        mediaControls,
        deviceManagement,
        localVideoCreate,
        participants,
        drawerStates,
        permissions,
        chat,
        screenShare,
        virtualBackground,
        recording,
        localRecording,
        closedCaptions,
        transcription,
        client,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        displayMessage
    ]);
};