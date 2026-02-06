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
import { MediabunnyRecorder } from '../utils/MediabunnyRecorder';
import JSZip from 'jszip';

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
    recordingStartTime: number | null;

    // Setters
    setIsRecordingActive: React.Dispatch<React.SetStateAction<boolean>>;

    // Methods
    startRecording: () => Promise<boolean>;
    stopRecording: (serverRecording?: boolean, localRecording?: boolean) => Promise<boolean>;

    // Local Recording Methods
    startLocalRecording: (stream?: MediaStream, timeslice?: number) => Promise<void>;
    stopLocalRecording: () => Promise<Blob | null>;
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

    // Mediabunny recorder ref for local recording
    const mediabunnyRecorderRef = useRef<MediabunnyRecorder | null>(null);
    const recordedSegmentsRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number | null>(null);
    const currentRecordingStreamRef = useRef<MediaStream | null>(null);

    /**
     * Start local recording using Mediabunny
     */
    const startLocalRecording = useCallback(async (stream?: MediaStream, _timeslice: number = 1000): Promise<void> => {
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
            return;
        }

        try {
            setLocalRecordingStatus(null); // Reset status for new recording
            recordedSegmentsRef.current = []; // Clear previous segments

            // Get the stream to record - use provided stream or get from client
            const recordingStream = stream || client.mediaStreamManager?.getCurrentStream();
            if (!recordingStream) {
                throw new Error('No media stream available for recording');
            }

            // Create and start Mediabunny recorder
            const recorder = new MediabunnyRecorder({
                videoCodec: 'avc',
                audioCodec: 'aac',
            });

            recorder.onstart = () => {
                log.log('Local recording started (Mediabunny)');
            };

            recorder.onerror = (error) => {
                log.error('Mediabunny recording error:', error);
                if (displayMessageRef.current) {
                    displayMessageRef.current(`Recording error: ${error.message}`, 'error');
                }
            };

            mediabunnyRecorderRef.current = recorder;
            currentRecordingStreamRef.current = recordingStream;
            recordingStartTimeRef.current = Date.now();

            await recorder.start(recordingStream);

            setIsLocalRecordingActive(true);
            setIsLocalRecordingPaused(false);

            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording started', 'success');
            }
        } catch (error) {
            log.error('Failed to start local recording:', error);
            if (displayMessageRef.current) {
                displayMessageRef.current('Failed to start local recording', 'error');
            }
        }
    }, [isLocalRecordingActive, conferenceClientRef]);

    /**
     * Upload local recording to S3 (using Mediabunny segments)
     */
    const uploadLocalRecording = useCallback(async (): Promise<boolean> => {
        const blobs = recordedSegmentsRef.current;

        if (blobs.length === 0) {
            log.warn('No recording data to upload');
            return false;
        }

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
            setIsUploading(true);
            setUploadStatus('uploading');
            setUploadError(null);
            setUploadProgress(0);

            // Create ZIP from Mediabunny recording segments
            const zip = new JSZip();
            blobs.forEach((blob, index) => {
                const segmentFilename = blobs.length === 1
                    ? `recording.mp4`
                    : `part${index + 1}.mp4`;
                zip.file(segmentFilename, blob);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });

            const { S3Client } = await import('@aws-sdk/client-s3');
            const { Upload } = await import('@aws-sdk/lib-storage');

            const s3Client = new S3Client({
                region,
                credentials: { accessKeyId, secretAccessKey }
            });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const streamName = conferenceClientRef?.current?.streamName || 'unknown';
            const key = `recordings/live/streams/localrecording_${roomName}_${timestamp}_${streamName}.zip`;

            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: bucket,
                    Key: key,
                    Body: zipBlob,
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
    }, [roomName, conferenceClientRef, t]);

    /**
     * Stop local recording (Mediabunny)
     */
    const stopLocalRecording = useCallback(async (): Promise<Blob | null> => {
        if (!mediabunnyRecorderRef.current) {
            log.warn('No local recording in progress');
            return null;
        }

        if (!isLocalRecordingActive) {
            log.warn('No local recording in progress');
            return null;
        }

        try {
            const blob = await mediabunnyRecorderRef.current.stop();

            if (blob) {
                // Add to segments
                recordedSegmentsRef.current.push(blob);

                const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
                log.log(`Local recording stopped. Size: ${sizeMB} MB`);

                setLocalRecordingStatus({
                    isRecording: false,
                    isPaused: false,
                    chunks: recordedSegmentsRef.current.length,
                    segments: recordedSegmentsRef.current.length,
                    estimatedSize: blob.size,
                    state: 'inactive',
                });

                if (displayMessageRef.current) {
                    displayMessageRef.current(`Local recording stopped (${sizeMB} MB)`, 'info');
                }
            }

            setIsLocalRecordingActive(false);
            setIsLocalRecordingPaused(false);
            currentRecordingStreamRef.current = null;

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
    }, [isLocalRecordingActive, hasS3Config, uploadLocalRecording, onRecordingStop]);

    /**
     * Pause local recording (Mediabunny)
     */
    const pauseLocalRecording = useCallback((): void => {
        if (!mediabunnyRecorderRef.current || !isLocalRecordingActive) return;

        try {
            mediabunnyRecorderRef.current.pause();
            setIsLocalRecordingPaused(true);
            log.log('Local recording paused');
            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording paused', 'info');
            }
        } catch (error) {
            log.error('Failed to pause local recording:', error);
        }
    }, [isLocalRecordingActive]);

    /**
     * Resume local recording (Mediabunny)
     */
    const resumeLocalRecording = useCallback((): void => {
        if (!mediabunnyRecorderRef.current || !isLocalRecordingActive) return;

        try {
            mediabunnyRecorderRef.current.resume();
            setIsLocalRecordingPaused(false);
            log.log('Local recording resumed');
            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording resumed', 'info');
            }
        } catch (error) {
            log.error('Failed to resume local recording:', error);
        }
    }, [isLocalRecordingActive]);

    /**
     * Download local recording as ZIP (Mediabunny MP4)
     */
    const downloadLocalRecording = useCallback(async (filename?: string): Promise<boolean> => {
        const blobs = recordedSegmentsRef.current;

        if (blobs.length === 0) {
            log.warn('No recorded data available');
            if (displayMessageRef.current) {
                displayMessageRef.current('No recording data available', 'warning');
            }
            return false;
        }

        try {
            const zip = new JSZip();

            // Add all segments to the ZIP
            blobs.forEach((blob, index) => {
                const segmentFilename = blobs.length === 1
                    ? `recording.mp4`
                    : `part${index + 1}.mp4`;
                zip.file(segmentFilename, blob);
            });

            // Generate ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });

            // Create download link
            const timestamp = (recordingStartTimeRef.current
                ? new Date(recordingStartTimeRef.current)
                : new Date()
            ).toISOString().replace(/[:.]/g, '-');
            const downloadFilename = filename || `recording-${timestamp}`;

            const url = URL.createObjectURL(zipBlob);
            const anchor = document.createElement('a');
            anchor.style.display = 'none';
            anchor.href = url;
            anchor.download = `${downloadFilename}.zip`;
            document.body.appendChild(anchor);
            anchor.click();

            setTimeout(() => {
                if (anchor.parentNode) {
                    document.body.removeChild(anchor);
                }
                URL.revokeObjectURL(url);
            }, 100);

            const totalSize = blobs.reduce((acc, blob) => acc + blob.size, 0);
            const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            log.log(`Recording downloaded: ${downloadFilename}.zip (${sizeMB} MB)`);

            if (displayMessageRef.current) {
                displayMessageRef.current(`Recording downloaded: ${downloadFilename}.zip (${sizeMB} MB)`, 'success');
            }
            return true;
        } catch (error) {
            log.error('Failed to download local recording:', error);
            if (displayMessageRef.current) {
                displayMessageRef.current('Failed to download recording', 'error');
            }
            return false;
        }
    }, []);

    /**
     * Get local recording blobs (Mediabunny)
     */
    const getLocalRecordingBlob = useCallback((): Blob[] | null => {
        return recordedSegmentsRef.current.length > 0 ? [...recordedSegmentsRef.current] : null;
    }, []);

    /**
     * Clear local recording (Mediabunny)
     */
    const clearLocalRecording = useCallback((): void => {
        try {
            // Cancel any active recording
            if (mediabunnyRecorderRef.current?.isRecording) {
                mediabunnyRecorderRef.current.cancel();
            }

            // Clear segments
            recordedSegmentsRef.current = [];
            mediabunnyRecorderRef.current = null;
            recordingStartTimeRef.current = null;
            currentRecordingStreamRef.current = null;

            // Close local recording drawer
            if (onRecordingClear) {
                onRecordingClear();
            }

            setLocalRecordingStatus(null);
            setIsLocalRecordingActive(false);
            setIsLocalRecordingPaused(false);

            if (displayMessageRef.current) {
                displayMessageRef.current('Local recording data cleared', 'info');
            }
        } catch (error) {
            log.error('Failed to clear local recording:', error);
        }
    }, [onRecordingClear]);

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
        recordingStartTime: recordingStartTimeRef.current,

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
