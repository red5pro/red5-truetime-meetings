// hooks/useConferenceState.ts
import { useState, useRef, useEffect } from 'react';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import {
    getLayoutPreference,
    getOutgoingBitrate,
    saveLayoutPreference,
    saveOutgoingBitrate,
} from '../utils/conferenceConfig';
import { USER_ROLES } from '../constants/userRoles';
import { getToken } from '../utils/tokenUtils';
import { useParams } from 'react-router-dom';
import { getUrlParameter } from '../utils/utils';

// Types
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

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

export const useConferenceState = () => {
    const _getInitRole = (): UserRole => {
        let initRole: UserRole;

        switch (getUrlParameter('role')) {
            case 'admin':
                initRole = USER_ROLES.ADMIN;
                break;
            case 'moderator':
                initRole = USER_ROLES.MODERATOR;
                break;
            case 'guest':
                initRole = USER_ROLES.GUEST;
                break;
            case 'observer':
                initRole = USER_ROLES.SUBSCRIBER;
                break;
            default:
                initRole = USER_ROLES.PUBLISHER;
        }

        return initRole;
    };

    // Room and connection state
    const { id } = useParams<{ id: string }>();
    const [roomName] = useState<string | undefined>(id);
    const { isGuest } = useGoogleAuth();

    // Initialize role based on URL parameter or guest status
    const [role, setRole] = useState<UserRole>(() => {
        if (isGuest) {
            return USER_ROLES.GUEST;
        }
        return _getInitRole();
    });

    // Update role when isGuest changes
    useEffect(() => {
        if (isGuest) {
            setRole(USER_ROLES.GUEST);
        }
    }, [isGuest]);

    const [token, setToken] = useState<string | null>(getToken());

    // UI state
    const [showEmojis, setShowEmojis] = useState<boolean>(false);
    const [isRaiseHand, setRaiseHand] = useState<boolean>(false);
    const [isGlassmorphic, setIsGlassmorphic] = useState<boolean>(false);

    // Layout and video settings
    const [layout, setLayout] = useState<string>(getLayoutPreference());
    const [outgoingBitrate, setOutgoingBitrate] = useState<string>(getOutgoingBitrate());

    // Dialog states
    const [unAuthorizedDialogOpen, setUnAuthorizedDialogOpen] = useState<boolean>(false);
    const [unAuthorizedDialogMessage, setUnAuthorizedDialogMessage] = useState<string>(
        'You are unauthorized to join this room.'
    );
    const [isMuteParticipantDialogOpen, setMuteParticipantDialogOpen] = useState<boolean>(false);
    const [participantIdMuted, setParticipantIdMuted] = useState<ParticipantMuted>({
        streamName: '',
        streamId: '',
    });

    // Stats and monitoring
    const [networkScore, setNetworkScore] = useState<NetworkScore>({
        inbound: 0,
        outbound: 0,
        statsSamples: {},
    });
    const [connectionStats, setConnectionStats] = useState<ConnectionStats>({});
    const [currentIssues, setCurrentIssues] = useState<string[]>([]);
    const [printStatLogs, setPrintStatLogs] = useState<boolean>(false);

    // Refs
    const layoutRef = useRef<string>(getLayoutPreference());
    const printStatLogsRef = useRef<boolean>(false);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);

    const updateOutgoingBitrate = (bitrate: string) => {
        saveOutgoingBitrate(bitrate);
        setOutgoingBitrate(bitrate);
    };

    const changeLayout = (newLayout: string) => {
        saveLayoutPreference(newLayout);
        setLayout(newLayout);
        layoutRef.current = newLayout;
    };

    return {
        // Basic state
        roomName,
        role,
        setRole,
        token,
        setToken,

        // UI state
        showEmojis,
        setShowEmojis,
        isRaiseHand,
        setRaiseHand,
        isGlassmorphic,
        setIsGlassmorphic,

        // Layout
        layout,
        setLayout,
        changeLayout,
        layoutRef,

        // Video settings
        outgoingBitrate,
        setOutgoingBitrate,
        updateOutgoingBitrate,

        // Dialogs
        unAuthorizedDialogOpen,
        setUnAuthorizedDialogOpen,
        unAuthorizedDialogMessage,
        setUnAuthorizedDialogMessage,
        isMuteParticipantDialogOpen,
        setMuteParticipantDialogOpen,
        participantIdMuted,
        setParticipantIdMuted,

        // Monitoring
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
    };
};