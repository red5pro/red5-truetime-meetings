// utils/conferenceConfig.ts

import { getUrlParameter, isNull, isConfigServiceAvailable } from './utils.tsx';
import { getRuntimeConfig } from './configStore';

// Types
interface IceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

interface PeerConnectionConfig {
    iceServers: IceServer[];
    sdpSemantics: 'unified-plan' | 'plan-b';
}

interface StatsThresholds {
    packetLossPercent: number;
    highRtt: number;
    highJitter: number;
    lowBitrate: number;
}

interface ConferenceClientConfig {
    host: string;
    nodeGroup: string;
    maxVideoBitrateKbps: number;
    iceServers: IceServer[];
    statsPollingInterval: number;
    statsHistorySize: number;
    statsThresholds: StatsThresholds;
    pubnubPublishKey?: string;
    pubnubSubscribeKey?: string;
    analyticsEndpoint?: string | null | undefined;
    configServiceUrl?: string;
    enableNoiseCancellation?: boolean;
}


interface ApiEndpoints {
    generateToken: string;
    startRecording: string;
    stopRecording: string;
    transcription: string;
    blockUser: string;
    unblockUser: string;
    getRoomUsers: string;
    getExternalStreams: string;
    addExternalStream: string;
    removeExternalStream: string;
    startTranscription: string;
    stopTranscription: string;
}

interface BackendConfig {
    host: string;
    shouldGenerateToken: boolean;
    apiEndpoints: ApiEndpoints;
}

interface BlurBackgroundOptions {
    blurAmount: number;
}

interface ImageBackgroundOptions {
    imageUrl: string | null;
}

interface ColorBackgroundOptions {
    color: string | null;
}

interface VirtualBackgroundConfig {
    type: 'blur' | 'image' | 'color';
    options: BlurBackgroundOptions | ImageBackgroundOptions | ColorBackgroundOptions;
}

interface VirtualBackgroundConfigs {
    'slight-blur': VirtualBackgroundConfig;
    'blur': VirtualBackgroundConfig;
    'image': VirtualBackgroundConfig;
    'color': VirtualBackgroundConfig;
}

/**
 * Setup and get peer connection configuration
 */
export const setupPeerConnectionConfig = (): PeerConnectionConfig => {
    const peerConfig: PeerConnectionConfig = {
        iceServers: [
            {
                urls: 'stun:stun1.l.google.com:19302',
            },
        ],
        sdpSemantics: 'unified-plan',
    };

    const turnServerURL = getRuntimeConfig().VITE_TURN_SERVER_URL as string | undefined;
    const turnUsername = getRuntimeConfig().VITE_TURN_SERVER_USERNAME as string | undefined;
    const turnCredential = getRuntimeConfig().VITE_TURN_SERVER_CREDENTIAL as string | undefined;

    if (turnServerURL) {
        peerConfig.iceServers.unshift({
            urls: turnServerURL,
            username: turnUsername,
            credential: turnCredential,
        });
    }

    return peerConfig;
};

/**
 * Get initial play-only mode setting
 */
export const getInitialPlayOnlyMode = (): boolean => {
    let initialPlayOnly = getUrlParameter('playOnly');

    if (isNull(initialPlayOnly)) {
        return false;
    }

    return initialPlayOnly === 'true';
};

/**
 * Get conference client configuration
 */
export const getConferenceClientConfig = (): ConferenceClientConfig => {
    const peerConfig = setupPeerConnectionConfig();

    return {
        host: getRuntimeConfig().VITE_HOST as string,
        nodeGroup: getRuntimeConfig().VITE_NODE_GROUP || 'default',
        maxVideoBitrateKbps: 3000,
        iceServers: peerConfig.iceServers,

        pubnubPublishKey: getRuntimeConfig().VITE_PUBNUB_PUBLISH_KEY as string,
        pubnubSubscribeKey: getRuntimeConfig().VITE_PUBNUB_SUBSCRIBE_KEY as string,

        // Stats monitoring configuration
        statsPollingInterval: 5000,    // Collect stats every 5 seconds
        statsHistorySize: 30,          // Keep 30 samples (1 minute of history)

        // Custom thresholds
        statsThresholds: {
            packetLossPercent: 3,        // Alert at 3% packet loss
            highRtt: 300,                // Alert at 300ms RTT
            highJitter: 30,              // Alert at 30ms jitter
            lowBitrate: 200000           // Alert below 200kbps
        },
        configServiceUrl: isConfigServiceAvailable() ? getRuntimeConfig().VITE_CONFIG_SERVICE_URL : undefined,
        enableNoiseCancellation: false
    };
};

/**
 * Get backend API configuration
 */
export const getBackendConfig = (): BackendConfig => {
    let apiHost;
    let shouldGenerateToken = true;

    if (isConfigServiceAvailable()) {
        apiHost = getRuntimeConfig().VITE_CONFIG_SERVICE_URL;
    } else if (getRuntimeConfig().VITE_BACKEND_HOST) {
        apiHost = `https://${getRuntimeConfig().VITE_BACKEND_HOST}`;
    } else {
        apiHost = `https://${getRuntimeConfig().VITE_HOST}`;
        shouldGenerateToken = false;
    }

    return {
        host: apiHost as string,
        shouldGenerateToken,
        apiEndpoints: {
            generateToken: '/api/generate-token',
            startRecording: isConfigServiceAvailable()
                ? '/api/room/{roomName}/startRecording'
                : '/as/v1/conference/room/{roomName}/startRecording',
            stopRecording: isConfigServiceAvailable()
                ? '/api/room/{roomName}/stopRecording'
                : '/as/v1/conference/room/{roomName}/stopRecording',
            transcription: isConfigServiceAvailable()
                ? '/api/room/{roomName}/transcriptions'
                : '/as/v1/conference/room/{roomName}/transcriptions',
            blockUser: isConfigServiceAvailable()
                ? '/api/room/{roomName}/user/{userId}/block'
                : '/as/v1/conference/room/{roomName}/user/{userId}/block',
            unblockUser: isConfigServiceAvailable()
                ? '/api/room/{roomName}/user/{userId}/unblock'
                : '/as/v1/conference/room/{roomName}/user/{userId}/unblock',
            getRoomUsers: isConfigServiceAvailable()
                ? '/api/room/{roomName}/users'
                : '/as/v1/conference/room/{roomName}/users',
            getExternalStreams: isConfigServiceAvailable()
                ? '/api/external-streams'
                : '/as/v1/conference/external-streams',
            addExternalStream: isConfigServiceAvailable()
                ? '/api/room/{roomName}/external-stream/{streamId}'
                : '/as/v1/conference/room/{roomName}/external-stream/{streamId}',
            removeExternalStream: isConfigServiceAvailable()
                ? '/api/room/{roomName}/external-stream/{streamId}'
                : '/as/v1/conference/room/{roomName}/external-stream/{streamId}',
            startTranscription: isConfigServiceAvailable()
                ? '/api/room/{roomName}/user/{userId}/start-transcription'
                : '/as/v1/conference/room/{roomName}/user/{userId}/start-transcription',
            stopTranscription: isConfigServiceAvailable()
                ? '/api/room/{roomName}/user/{userId}/stop-transcription'
                : '/as/v1/conference/room/{roomName}/user/{userId}/stop-transcription',
        }
    };
};

/**
 * Get virtual background configurations
 */
export const getVirtualBackgroundConfigs = (): VirtualBackgroundConfigs => {
    return {
        'slight-blur': {
            type: 'blur',
            options: { blurAmount: 10 }
        },
        'blur': {
            type: 'blur',
            options: { blurAmount: 50 }
        },
        'image': {
            type: 'image',
            options: { imageUrl: null } // URL will be provided dynamically
        },
        'color': {
            type: 'color',
            options: { color: null } // Color will be provided dynamically
        }
    };
};

/**
 * Get layout preferences
 */
export const getLayoutPreference = (): string => {
    return localStorage.getItem('layoutPreference') || 'Auto';
};

/**
 * Save layout preference
 */
export const saveLayoutPreference = (layout: string): void => {
    localStorage.setItem('layoutPreference', layout);
};

/**
 * Get desired tile count
 */
export const getDesiredTileCount = (): number => {
    const stored = localStorage.getItem('desiredTileCount');
    return stored ? parseInt(stored, 10) : 60;
};

/**
 * Save desired tile count
 */
export const saveDesiredTileCount = (count: number): void => {
    localStorage.setItem('desiredTileCount', count.toString());
};

/**
 * Get outgoing bitrate preference
 */
export const getOutgoingBitrate = (): string => {
    return localStorage.getItem('outgoingBitrate') || '1500';
};

/**
 * Save outgoing bitrate preference
 */
export const saveOutgoingBitrate = (bitrate: string): void => {
    localStorage.setItem('outgoingBitrate', bitrate);
};