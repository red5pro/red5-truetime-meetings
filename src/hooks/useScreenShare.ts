import { useState, useRef, useEffect, MutableRefObject, useCallback } from 'react';
import { MetaDataKeys } from '../constants/metaDataKeys';
import { usePostRequest } from './usePostRequest';
import { getBackendConfig } from '../utils/conferenceConfig';

// Type definitions
type UserRole = 'admin' | 'user' | 'moderator' | 'guest';

interface ScreenShareConfig {
    width: number;
    height: number;
    frameRate: number;
    includeAudio: boolean;
    metaData: string;
    token: string;
}

interface TokenResponse {
    token: string;
}

interface ConferenceClient {
    getIsJoined: () => boolean;
    startScreenShare: (config: ScreenShareConfig) => Promise<void>;
    stopScreenShare: () => Promise<void>;
}

interface PostData {
    (url: string, data: any): Promise<TokenResponse>;
}

interface UseScreenShareReturn {
    isScreenShared: boolean;
    isStartingScreenShare: boolean;
    showScreenShareSpinner: MutableRefObject<boolean>;
    handleStartScreenShare: () => Promise<void>;
    handleStopScreenShare: () => Promise<void>;
    setIsScreenShared: React.Dispatch<React.SetStateAction<boolean>>;
    setIsStartingScreenShare: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useScreenShare = (
    conferenceClientRef: MutableRefObject<ConferenceClient | null>,
    publishStreamIdRef: MutableRefObject<string | null>,
    streamName: string,
    roomName: string,
    role: UserRole,
    displayMessage: (message: string) => void
): UseScreenShareReturn => {
    const [isScreenShared, setIsScreenShared] = useState<boolean>(false);
    const [isStartingScreenShare, setIsStartingScreenShare] = useState<boolean>(false);
    const showScreenShareSpinner = useRef<boolean>(false);
    const { postData }: { postData: PostData } = usePostRequest();

    // Use refs to store latest function references without triggering re-renders
    const postDataRef = useRef(postData);
    const displayMessageRef = useRef(displayMessage);

    // Keep refs up to date
    useEffect(() => {
        postDataRef.current = postData;
    }, [postData]);

    useEffect(() => {
        displayMessageRef.current = displayMessage;
    }, [displayMessage]);

    const handleStartScreenShare = useCallback(async (): Promise<void> => {
        if (!conferenceClientRef.current?.getIsJoined()) {
            displayMessageRef.current('Must be joined to a room first');
            return;
        }
        showScreenShareSpinner.current = true;
        setIsStartingScreenShare(true);
    }, [conferenceClientRef]);

    const handleStopScreenShare = useCallback(async (): Promise<void> => {
        try {
            if (conferenceClientRef.current) {
                await conferenceClientRef.current.stopScreenShare();
                setIsScreenShared(false);
                showScreenShareSpinner.current = false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Failed to stop screen share:', error);
            displayMessageRef.current('Failed to stop screen share: ' + errorMessage);
        }
    }, [conferenceClientRef]);

    useEffect(() => {
        if (isStartingScreenShare && conferenceClientRef.current && publishStreamIdRef.current) {
            const getScreenShareMetaData = (): string => {
                const metaDataObj: { [key: string]: string | boolean } = {};
                metaDataObj[MetaDataKeys.OWNER_STREAM_ID] = publishStreamIdRef.current || '';
                metaDataObj[MetaDataKeys.OWNER_NAME] = streamName;
                metaDataObj[MetaDataKeys.NAME] = streamName + "'s Screen Share";
                metaDataObj[MetaDataKeys.IS_SCREEN_SHARING] = true;
                return JSON.stringify(metaDataObj);
            };

            const startScreenShare = async () => {
                try {

                    let token: string = '';


                    const backendConfig = getBackendConfig();
                    if (backendConfig.shouldGenerateToken) {
                        const url = `${backendConfig.host}${backendConfig.apiEndpoints.generateToken}`;
                        const result: TokenResponse = await postDataRef.current(
                            url,
                            {
                                userId: publishStreamIdRef.current + '-screenshare',
                                roomId: roomName,
                                role: role,
                                expirationMinutes: 120
                            }
                        );
                        token = result.token;
                    } else {
                        token = '';
                    }

                    if (conferenceClientRef.current) {
                        await conferenceClientRef.current.startScreenShare({
                            width: 1920,
                            height: 1080,
                            frameRate: 30,
                            includeAudio: true,
                            metaData: getScreenShareMetaData(),
                            token: token
                        });

                        setIsScreenShared(true);
                        setIsStartingScreenShare(false);
                        showScreenShareSpinner.current = false;
                    } else {
                        throw new Error('Conference client not available');
                    }
                } catch (error: any) {
                    console.error('Failed to start screen share:', error);
                    setIsStartingScreenShare(false);
                    setIsScreenShared(false);
                    showScreenShareSpinner.current = false;
                    displayMessageRef.current('Failed to start screen share: ' + error.message);
                }
            };

            startScreenShare();
        }
    }, [isStartingScreenShare, roomName, role, conferenceClientRef, publishStreamIdRef, streamName]);

    return {
        isScreenShared,
        isStartingScreenShare,
        showScreenShareSpinner,
        handleStartScreenShare,
        handleStopScreenShare,
        setIsScreenShared,
        setIsStartingScreenShare
    };
};