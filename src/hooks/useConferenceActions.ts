// hooks/useConferenceActions.ts
import { useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { USER_ROLES, UserRole } from "../constants/userRoles";
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
        metadata: any
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
    setToken: (token: string) => void,
    displayMessage: (message: string) => void,
    localVideoCreate: () => Promise<void>,
    googleToken: string | null
): UseConferenceActionsReturn => {
    // Use refs to store latest function references without triggering re-renders
    const postDataRef = useRef(postData);
    const setTokenRef = useRef(setToken);
    const displayMessageRef = useRef(displayMessage);
    const localVideoCreateRef = useRef(localVideoCreate);

    // Keep refs up to date
    useEffect(() => {
        postDataRef.current = postData;
    }, [postData]);

    useEffect(() => {
        setTokenRef.current = setToken;
    }, [setToken]);

    useEffect(() => {
        displayMessageRef.current = displayMessage;
    }, [displayMessage]);

    useEffect(() => {
        localVideoCreateRef.current = localVideoCreate;
    }, [localVideoCreate]);

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
                    displayMessageRef.current('The configuration server is unreachable. Please verify your connection or contact support.');
                    return false;
                }
                if (response.status === 200) {
                    const data = await response.json();
                    if (data.isAvailable === false) {
                        displayMessageRef.current('The node group is currently deploying and not yet active. Please try again in a few moments.');
                        return false;
                    }
                }
            } else {
                if (response.status === 404 || response.status === 500) {
                    displayMessageRef.current('The node group is currently deploying and not yet active. Please try again in a few moments.');
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
                displayMessageRef.current('The configuration server is unreachable. Please verify your connection or contact support.');
                return false;
            }
        }
        return true;
    }, []);

    const joinRoom = useCallback(async (roomName: string, generatedStreamId: string): Promise<void> => {
        const isValid = await preJoinChecks();

        if (!isValid) {
            roomState.setIsJoining(false);
            roomState.setIsWaitingApproval(false);
            return;
        }

        roomState.publishStreamIdRef.current = generatedStreamId;
        roomState.setIsJoining(true);
        if (role === USER_ROLES.GUEST) {
            roomState.setIsWaitingApproval(true);
        }

        if (client.conferenceClient.current) {
            client.conferenceClient.current.mediaStreamManager.publisherName = roomState.streamName;
        }

        const metadata = updateMetaData(null, MetaDataKeys.NAME, roomState.streamName);
        let result;



        const backendConfig = getBackendConfig();
        try {
            if (backendConfig.shouldGenerateToken) {
                const url = `${backendConfig.host}${backendConfig.apiEndpoints.generateToken}`;
                result = await postDataRef.current(url, {
                    userId: generatedStreamId,
                    roomId: roomName,
                    role: role,
                    expirationMinutes: 300
                }, {
                    headers: {
                        Authorization: `Bearer ${googleToken}`
                    }
                });

                setTokenRef.current(result.token);
            } else {
                result = { token: '' };
                setTokenRef.current('');
            }
        } catch (error) {
            log.error('Join failed:', error);

            displayMessageRef.current('There was an error generating the token. Please try again.');
            roomState.setIsJoining(false);
            roomState.setIsWaitingApproval(false);
            return;
        }


        try {
            const streamToUse = !roomState.isPlayOnly
                ? client.conferenceClient.current?.mediaStreamManager.getCurrentStream() || null
                : null;

            await client.joinRoom(
                roomName,
                generatedStreamId,
                result?.token ?? '',
                role,
                streamToUse,
                !mediaControls.isMyCamTurnedOff,
                !mediaControls.isMyMicMuted,
                metadata
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            log.error('Join failed:', error);

            displayMessageRef.current(`Failed to join: ${errorMessage}`);
            roomState.setIsJoining(false);
            roomState.setIsWaitingApproval(false);
        }
    }, [client, roomState, mediaControls, role]);

    const leaveRoom = useCallback(async (): Promise<void> => {
        try {
            await client.leaveRoom();
            participantsHook.setParticipants({});
            participantsHook.setSubscribedParticipants({});
            participantsHook.talkerAudioLevelsRef.current = {};
            roomState.setIsJoining(false);
            roomState.setIsWaitingApproval(false);
        } catch (error) {
            log.error('Leave failed:', error);
        }
        localVideoCreateRef.current();
    }, [client, participantsHook, roomState]);

    const pinVideo = useCallback((streamId: string): void => {
        log.log('Participant', streamId, 'pinned.');
        participantsHook.pinnedParticipantIdRef.current = streamId;
        participantsHook.setPinnedParticipantId(streamId);
    }, [participantsHook]);

    const unpinVideo = useCallback((streamId: string = ''): void => {
        log.log('Participant', streamId, 'unpinned.');
        participantsHook.pinnedParticipantIdRef.current = null;
        participantsHook.setPinnedParticipantId(null);
    }, [participantsHook]);

    const sendNotificationEvent = useCallback((
        eventType: string,
        publishStreamId: string,
        info?: any
    ): void => {
        client.sendEvent(eventType, {
            streamId: publishStreamId,
            ...(info || {})
        });
    }, [client]);

    const approveGuestJoinRequest = useCallback(async (userId: string): Promise<void> => {
        if (!client.conferenceClient.current?.approveGuest) {
            log.error('approveGuest method not found on conference client');
            return
        }

        await client.conferenceClient.current.approveGuest(userId);

        participantsHook.setGuestsWaitingApproval(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
        });

        participantsHook.setGuestParticipantRequestList(prev => prev.filter(id => id !== userId));

        displayMessageRef.current(`${userId}'s join request approved`);

    }, [client, participantsHook]);

    const rejectGuestJoinRequest = useCallback(async (userId: string): Promise<void> => {
        if (!client.conferenceClient.current?.rejectGuest) {
            log.error('rejectGuest method not found on conference client');
            return;
        }
        await client.conferenceClient.current.rejectGuest(userId);

        participantsHook.setGuestsWaitingApproval(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
        });

        participantsHook.setGuestParticipantRequestList(prev => prev.filter(id => id !== userId));

        displayMessageRef.current(`${userId}'s join request rejected`);
    }, [participantsHook]);

    return {
        joinRoom,
        leaveRoom,
        pinVideo,
        unpinVideo,
        sendNotificationEvent,
        approveGuestJoinRequest,
        rejectGuestJoinRequest
    };
};
