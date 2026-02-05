// hooks/useRecording.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { UserRole } from "../constants/userRoles";
import { usePostRequest } from './usePostRequest';
import { getBackendConfig } from '../utils/conferenceConfig';
import log from 'loglevel';
import { getRuntimeConfig } from '../utils/configStore';
import { useTranslation } from 'react-i18next';
import { ConferenceClient } from "red5pro-conference-sdk";
import { ConferenceEvents } from "red5pro-conference-sdk";

// Type definitions
type MessageVariant = 'info' | 'success' | 'error' | 'warning';

interface BackendConfig {
    host: string;
    apiEndpoints: {
        startRecording: string;
        stopRecording: string;
    };
}

interface PostRequestOptions {
    headers?: Record<string, string>;
}

interface PostData {
    (url: string, data: any, options?: PostRequestOptions): Promise<any>;
}

interface UsePostRequestReturn {
    postData: PostData;
}

interface LocalRecordingStatus {
    isRecording: boolean;
    isPaused: boolean;
    chunks: number;
    segments: number;
    estimatedSize: number;
    state: string | null;
}

interface UseRecordingReturn {
    // Server Recording State
    isRecordingActive: boolean;
    isRecordingStarting: boolean;
    isRecordingStopping: boolean;

    // Local Recording State
    isLocalRecordingActive: boolean;
    isLocalRecordingPaused: boolean;
    localRecordingStatus: LocalRecordingStatus | null;
    isUploading: boolean;
    uploadProgress: number;
    uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
    uploadError: string | null;
    hasS3Config: boolean;

    // Setters
    setIsRecordingActive: React.Dispatch<React.SetStateAction<boolean>>;

    // Methods
    startRecording: () => Promise<boolean>;
    stopRecording: (serverRecording?: boolean, localRecording?: boolean) => Promise<boolean>;

    // Local Recording Methods
    startLocalRecording: (stream?: MediaStream, timeslice?: number) => void;
    stopLocalRecording: () => Blob | null;
    pauseLocalRecording: () => void;
    resumeLocalRecording: () => void;
    downloadLocalRecording: (filename?: string) => Promise<boolean>;
    uploadLocalRecording: () => Promise<boolean>;
    getLocalRecordingBlob: () => Blob[] | null;
    clearLocalRecording: () => void;
}

export const useRecording = (
    roomName: string,
    token: string,
    _role: UserRole,
    displayMessage?: (message: string, variant?: MessageVariant) => void,
    conferenceClientRef?: React.MutableRefObject<ConferenceClient | null>,
    onRecordingStop?: () => void,
    onRecordingClear?: () => void
): UseRecordingReturn => {
    const { t } = useTranslation();
    const config = getRuntimeConfig();
    const hasS3Config = !!(config.VITE_AWS_ACCESS_KEY && config.VITE_AWS_SECRET_ACCESS_KEY && config.VITE_AWS_BUCKET_NAME);

    // Server Recording State
    const [isRecordingActive, setIsRecordingActive] = useState<boolean>(false);
    const [isRecordingStarting, setIsRecordingStarting] = useState<boolean>(false);
    const [isRecordingStopping, setIsRecordingStopping] = useState<boolean>(false);

    // Local Recording State
    const [isLocalRecordingActive, setIsLocalRecordingActive] = useState<boolean>(false);
    const [isLocalRecordingPaused, setIsLocalRecordingPaused] = useState<boolean>(false);
    const [localRecordingStatus, setLocalRecordingStatus] = useState<LocalRecordingStatus | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadError, setUploadError] = useState<string | null>(null);

    const { postData }: UsePostRequestReturn = usePostRequest();
    const backendConfig: BackendConfig = getBackendConfig();

    // Use refs to store latest function references and state values without triggering re-renders
    const postDataRef = useRef(postData);
    const displayMessageRef = useRef(displayMessage);
    const isRecordingActiveRef = useRef(isRecordingActive);
    const isRecordingStartingRef = useRef(isRecordingStarting);
    const isRecordingStoppingRef = useRef(isRecordingStopping);

    // Keep refs up to date
    useEffect(() => {
        postDataRef.current = postData;
    }, [postData]);

    useEffect(() => {
        displayMessageRef.current = displayMessage;
    }, [displayMessage]);

    useEffect(() => {
        isRecordingActiveRef.current = isRecordingActive;
    }, [isRecordingActive]);

    useEffect(() => {
        isRecordingStartingRef.current = isRecordingStarting;
    }, [isRecordingStarting]);

    useEffect(() => {
        isRecordingStoppingRef.current = isRecordingStopping;
    }, [isRecordingStopping]);

    // Setup event listeners for local recording events
    useEffect(() => {
        if (!conferenceClientRef?.current) return;
        const client = conferenceClientRef.current;

        const handleRecordingStarted = () => {
            setIsLocalRecordingActive(true);
            setIsLocalRecordingPaused(false);
            log.log('Local recording started');
            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording started', 'success');
            }
        };

        const handleRecordingStopped = (event: CustomEvent) => {
            setIsLocalRecordingActive(false);
            setIsLocalRecordingPaused(false);
            const { size } = event.detail || {};
            log.log('Local recording stopped. Size:', size);
            if (displayMessageRef.current) {
                const sizeMB = size ? (size / (1024 * 1024)).toFixed(2) : '0';
                displayMessageRef.current(`Local recording stopped (${sizeMB} MB)`, 'info');
            }
            if (onRecordingStop) {
                onRecordingStop();
            }
        };

        const handleRecordingPaused = () => {
            setIsLocalRecordingPaused(true);
            log.log('Local recording paused');
            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording paused', 'info');
            }
        };

        const handleRecordingResumed = () => {
            setIsLocalRecordingPaused(false);
            log.log('Local recording resumed');
            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording resumed', 'info');
            }
        };

        const handleRecordingError = (event: CustomEvent) => {
            const { error } = event.detail || {};
            log.error('Local recording error:', error);
            if (displayMessageRef.current && error !== "Recording already in progress") {
                displayMessageRef.current(`Local recording error: ${error}`, 'error');
            }
        };

        const handleRecordingDownloaded = (event: CustomEvent) => {
            const { filename, size } = event.detail || {};
            log.log('Local recording downloaded:', filename);
            if (displayMessageRef.current) {
                const sizeMB = size ? (size / (1024 * 1024)).toFixed(2) : '0';
                displayMessageRef.current(`Recording downloaded: ${filename} (${sizeMB} MB)`, 'success');
            }
        };

        const handleRecordingData = (event: CustomEvent) => {
            const { data } = event.detail || {};
            log.log('Local recording data:', data);
        };

        const handleRecordingCleared = () => {
            setLocalRecordingStatus(null);
            log.log('Local recording status cleared');
        };

        // Add event listeners
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_STARTED, handleRecordingStarted as EventListener);
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_STOPPED, handleRecordingStopped as EventListener);
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_PAUSED, handleRecordingPaused as EventListener);
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_RESUMED, handleRecordingResumed as EventListener);
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_ERROR, handleRecordingError as EventListener);
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_DOWNLOADED, handleRecordingDownloaded as EventListener);
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_DATA, handleRecordingData as EventListener);
        client.addEventListener(ConferenceEvents.LOCAL_RECORDING_CLEARED, handleRecordingCleared as EventListener);

        return () => {
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_STARTED, handleRecordingStarted as EventListener);
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_STOPPED, handleRecordingStopped as EventListener);
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_PAUSED, handleRecordingPaused as EventListener);
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_RESUMED, handleRecordingResumed as EventListener);
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_ERROR, handleRecordingError as EventListener);
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_DOWNLOADED, handleRecordingDownloaded as EventListener);
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_DATA, handleRecordingData as EventListener);
            client.removeEventListener(ConferenceEvents.LOCAL_RECORDING_CLEARED, handleRecordingCleared as EventListener);
        };
    }, [conferenceClientRef?.current]); // Depend on the current value of the ref

    // Update status periodically when local recording is active
    useEffect(() => {
        if (!conferenceClientRef?.current || !isLocalRecordingActive) {
            return;
        }

        const client = conferenceClientRef.current;
        const updateStatus = () => {
            try {
                const status = client.getLocalRecordingStatus();
                setLocalRecordingStatus(status);
            } catch (error) {
                log.error('Failed to update local recording status:', error);
            }
        };

        // Initial update
        updateStatus();

        // Set interval for periodic updates
        const interval = setInterval(updateStatus, 1000);

        return () => clearInterval(interval);
    }, [isLocalRecordingActive, conferenceClientRef]);

    /**
     * Start server recording
     */
    const startRecording = useCallback(async (recordSeparately: boolean = false, serverRecording: boolean = true, localRecording: boolean = true): Promise<boolean> => {
        if (!roomName) {
            log.error('Room name is required to start recording');
            if (displayMessageRef.current) {
                displayMessageRef.current('Cannot start recording: Not in a room', 'error');
            }
            return false;
        }

        if (isRecordingActiveRef.current) {
            log.warn('Recording is already active');
            if (displayMessageRef.current) {
                displayMessageRef.current('Recording is already active', 'warning');
            }
            return false;
        }

        if (isRecordingStartingRef.current) {
            log.warn('Recording is already starting');
            return false;
        }

        try {
            setIsRecordingStarting(true);

            const url = `${backendConfig.host}${backendConfig.apiEndpoints.startRecording.replace('{roomName}', roomName)}?recordParticipantStreams=${recordSeparately}&serverRecording=${serverRecording}&localRecording=${localRecording}`;

            log.log('Starting recording for room:', roomName);
            if (displayMessageRef.current) {
                displayMessageRef.current('Recording is starting...', 'info');
            }

            const response = await postDataRef.current(url, null, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (response) {
                setIsRecordingActive(true);
                log.log('Recording started successfully');
                if (displayMessageRef.current) {
                    displayMessageRef.current('Recording started', 'success');
                }
                return true;
            }

            return false;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            log.error('Failed to start recording:', error);
            if (displayMessageRef.current) {
                displayMessageRef.current('Failed to start recording: ' + errorMessage, 'error');
            }
            return false;
        } finally {
            setIsRecordingStarting(false);
        }
    }, [roomName, token, backendConfig.apiEndpoints.startRecording]);

    /**
     * Stop server recording
     */
    const stopRecording = useCallback(async (serverRecording: boolean = true, localRecording: boolean = true): Promise<boolean> => {
        if (!roomName) {
            log.error('Room name is required to stop recording');
            if (displayMessageRef.current) {
                displayMessageRef.current('Cannot stop recording: Not in a room', 'error');
            }
            return false;
        }

        if (isRecordingStoppingRef.current) {
            log.warn('Recording is already stopping');
            return false;
        }

        try {
            setIsRecordingStopping(true);

            const url = `${backendConfig.host}${backendConfig.apiEndpoints.stopRecording.replace('{roomName}', roomName)}?serverRecording=${serverRecording}&localRecording=${localRecording}`;

            log.log('Stopping recording for room:', roomName);
            if (displayMessageRef.current) {
                displayMessageRef.current('Recording is stopping...', 'info');
            }

            const response = await postDataRef.current(url, null, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (response) {
                setIsRecordingActive(false);
                log.log('Recording stopped successfully');
                if (displayMessageRef.current) {
                    displayMessageRef.current('Recording stopped', 'success');
                }
                return true;
            }

            return false;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            log.error('Failed to stop recording:', error);
            if (displayMessageRef.current) {
                displayMessageRef.current('Failed to stop recording: ' + errorMessage, 'error');
            }
            return false;
        } finally {
            setIsRecordingStopping(false);
        }
    }, [roomName, token, backendConfig.apiEndpoints.stopRecording]);

    /**
     * Start local recording
     */
    const startLocalRecording = useCallback((stream?: MediaStream, timeslice: number = 1000): void => {
        if (!conferenceClientRef?.current) {
            log.error('Conference client not available');
            if (displayMessageRef.current) {
                displayMessageRef.current('Cannot start recording: Not connected', 'error');
            }
            return;
        }
        const client = conferenceClientRef.current;

        if (isLocalRecordingActive) {
            log.warn('Local recording is already active');
            // TODO: when we join a room with local recording already active, startLocalRecording called multiple times, fix it! 
            return;
        }

        try {
            setLocalRecordingStatus(null); // Reset status for new recording
            client.startLocalRecording(stream, timeslice);
        } catch (error) {
            log.error('Failed to start local recording:', error);
            if (displayMessageRef.current) {
                displayMessageRef.current('Failed to start local recording', 'error');
            }
        }
    }, [isLocalRecordingActive, conferenceClientRef]);

    /**
     * Upload local recording to S3
     */
    const uploadLocalRecording = useCallback(async (): Promise<boolean> => {
        if (!conferenceClientRef?.current) {
            log.error('Conference client not available');
            return false;
        }
        const client = conferenceClientRef.current;

        const config = getRuntimeConfig();
        const accessKeyId = config.VITE_AWS_ACCESS_KEY;
        const secretAccessKey = config.VITE_AWS_SECRET_ACCESS_KEY;
        const bucket = config.VITE_AWS_BUCKET_NAME;
        const region = config.VITE_AWS_BUCKET_LOCATION || 'us-east-1';

        if (!accessKeyId || !secretAccessKey || !bucket) {
            log.error('AWS S3 configuration missing');
            return false;
        }

        try {
            const blob = await client.generateLocalRecordingZip();
            if (!blob) {
                log.warn('No recording data to upload');
                return false;
            }

            setIsUploading(true);
            setUploadStatus('uploading');
            setUploadError(null);
            setUploadProgress(0);

            const { S3Client } = await import('@aws-sdk/client-s3');
            const { Upload } = await import('@aws-sdk/lib-storage');

            const s3Client = new S3Client({
                region,
                credentials: { accessKeyId, secretAccessKey }
            });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const key = `recordings/live/streams/localrecording_${roomName}_${timestamp}_${client.streamName}.zip`;

            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: bucket,
                    Key: key,
                    Body: blob,
                    ContentType: 'application/zip'
                },
                // Disable checksum to avoid CRC32 multipart upload issues
                leavePartsOnError: false
            });

            upload.on('httpUploadProgress', (progress) => {
                if (progress.loaded && progress.total) {
                    const percentage = Math.round((progress.loaded / progress.total) * 100);
                    setUploadProgress(percentage);
                }
            });

            await upload.done();

            setIsUploading(false);
            setUploadStatus('success');
            setUploadProgress(100);

            if (displayMessageRef.current) {
                displayMessageRef.current(t('Recording uploaded successfully to S3'), 'success');
            }
            return true;
        } catch (error) {
            log.error('Failed to upload recording to S3:', error);
            setIsUploading(false);
            setUploadStatus('error');
            setUploadError(error instanceof Error ? error.message : String(error));
            if (displayMessageRef.current) {
                displayMessageRef.current(t('Failed to upload recording to S3'), 'error');
            }
            return false;
        }
    }, [conferenceClientRef, t]);

    /**
     * Stop local recording
     */
    const stopLocalRecording = useCallback((): Blob | null => {
        if (!conferenceClientRef?.current) {
            log.error('Conference client not available');
            return null;
        }
        const client = conferenceClientRef.current;

        if (!isLocalRecordingActive) {
            log.warn('No local recording in progress');
            return null;
        }

        try {
            const blob = client.stopLocalRecording();
            const finalStatus = client.getLocalRecordingStatus();
            setLocalRecordingStatus(finalStatus);

            // Auto-upload if S3 config is present
            if (hasS3Config) {
                uploadLocalRecording();
            }

            if (onRecordingStop) {
                onRecordingStop();
            }

            return blob;
        } catch (error) {
            log.error('Failed to stop local recording:', error);
            if (displayMessageRef.current) {
                displayMessageRef.current('Failed to stop local recording', 'error');
            }
            return null;
        }
    }, [isLocalRecordingActive, conferenceClientRef, hasS3Config, uploadLocalRecording, onRecordingStop]);

    /**
     * Pause local recording
     */
    const pauseLocalRecording = useCallback((): void => {
        if (!conferenceClientRef?.current || !isLocalRecordingActive) return;
        const client = conferenceClientRef.current;

        try {
            client.pauseLocalRecording();
        } catch (error) {
            log.error('Failed to pause local recording:', error);
        }
    }, [isLocalRecordingActive, conferenceClientRef]);

    /**
     * Resume local recording
     */
    const resumeLocalRecording = useCallback((): void => {
        if (!conferenceClientRef?.current || !isLocalRecordingActive) return;
        const client = conferenceClientRef.current;

        try {
            client.resumeLocalRecording();
        } catch (error) {
            log.error('Failed to resume local recording:', error);
        }
    }, [isLocalRecordingActive, conferenceClientRef]);

    /**
     * Download local recording as ZIP
     */
    const downloadLocalRecording = useCallback(async (filename?: string): Promise<boolean> => {
        if (!conferenceClientRef?.current) {
            log.error('Conference client not available');
            return false;
        }
        const client = conferenceClientRef.current;

        try {
            return await client.downloadLocalRecording(filename);
        } catch (error) {
            log.error('Failed to download local recording:', error);
            if (displayMessageRef.current) {
                displayMessageRef.current('Failed to download recording', 'error');
            }
            return false;
        }
    }, [conferenceClientRef]);

    /**
     * Get local recording blobs
     */
    const getLocalRecordingBlob = useCallback((): Blob[] | null => {
        if (!conferenceClientRef?.current) return null;
        const client = conferenceClientRef.current;

        try {
            return client.getLocalRecordingBlob();
        } catch (error) {
            log.error('Failed to get local recording blob:', error);
            return null;
        }
    }, [conferenceClientRef]);

    /**
     * Clear local recording
     */
    const clearLocalRecording = useCallback((): void => {
        if (!conferenceClientRef?.current) return;
        const client = conferenceClientRef.current;

        try {
            client.clearLocalRecording();
            // close local recording drawer
            if (onRecordingClear) {
                onRecordingClear();
            }

            setLocalRecordingStatus(null);
            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording data cleared', 'info');
            }
        } catch (error) {
            log.error('Failed to clear local recording:', error);
        }
    }, [conferenceClientRef, onRecordingClear]);

    return {
        // Server Recording State
        isRecordingActive,
        isRecordingStarting,
        isRecordingStopping,

        // Local Recording State
        isLocalRecordingActive,
        isLocalRecordingPaused,
        localRecordingStatus,
        isUploading,
        uploadProgress,
        uploadStatus,
        uploadError,
        hasS3Config,

        // Setters
        setIsRecordingActive,

        // Methods
        startRecording,
        stopRecording,

        // Local Recording Methods
        startLocalRecording,
        stopLocalRecording,
        pauseLocalRecording,
        resumeLocalRecording,
        downloadLocalRecording,
        uploadLocalRecording,
        getLocalRecordingBlob,
        clearLocalRecording
    };
};