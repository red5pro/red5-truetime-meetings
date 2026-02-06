/**
 * useMediabunnyRecording - A React hook for local recording using mediabunny
 * 
 * This hook provides a drop-in replacement for the existing local recording
 * functionality in useRecording, but uses mediabunny instead of MediaRecorder
 * for better codec support and proper duration metadata.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { MediabunnyRecorder, RecordingOptions, RecordingStatus } from '../utils/MediabunnyRecorder';
import JSZip from 'jszip';

export interface UseMediabunnyRecordingOptions {
    /** Called when recording starts */
    onRecordingStart?: () => void;
    /** Called when recording stops with the recorded blob */
    onRecordingStop?: (blob: Blob) => void;
    /** Called when an error occurs */
    onError?: (error: Error) => void;
    /** Called when recording is paused */
    onPause?: () => void;
    /** Called when recording is resumed */
    onResume?: () => void;
    /** Recording options (codec, bitrate) */
    recordingOptions?: RecordingOptions;
}

export interface UseMediabunnyRecordingReturn {
    /** Whether recording is currently active */
    isRecording: boolean;
    /** Whether recording is paused */
    isPaused: boolean;
    /** Start recording the provided stream */
    startRecording: (stream: MediaStream) => Promise<void>;
    /** Stop recording and get the blob */
    stopRecording: () => Promise<Blob | null>;
    /** Pause recording */
    pauseRecording: () => void;
    /** Resume recording */
    resumeRecording: () => void;
    /** Cancel recording without saving */
    cancelRecording: () => Promise<void>;
    /** Get the current recording status */
    getStatus: () => RecordingStatus;
    /** Get all recorded segments as blobs */
    getRecordingBlobs: () => Blob[];
    /** Clear all recorded data */
    clearRecording: () => void;
    /** Download recording as a ZIP file */
    downloadRecording: (filename?: string) => Promise<boolean>;
    /** The MIME type of the recording */
    mimeType: string;
    /** Array of recorded segments (populated on track changes) */
    segments: Blob[];
}

/**
 * React hook for local recording using mediabunny
 * 
 * @example
 * ```tsx
 * const {
 *   isRecording,
 *   startRecording,
 *   stopRecording,
 *   pauseRecording,
 *   resumeRecording,
 * } = useMediabunnyRecording({
 *   onRecordingStop: (blob) => console.log('Recorded:', blob.size, 'bytes'),
 *   onError: (error) => console.error('Recording error:', error),
 * });
 * 
 * // Start recording
 * await startRecording(mediaStream);
 * 
 * // Stop and get blob
 * const blob = await stopRecording();
 * ```
 */
export function useMediabunnyRecording(options: UseMediabunnyRecordingOptions = {}): UseMediabunnyRecordingReturn {
    const {
        onRecordingStart,
        onRecordingStop,
        onError,
        onPause,
        onResume,
        recordingOptions,
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [segments, setSegments] = useState<Blob[]>([]);

    const recorderRef = useRef<MediabunnyRecorder | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const currentStreamRef = useRef<MediaStream | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recorderRef.current?.isRecording) {
                recorderRef.current.cancel().catch(console.error);
            }
        };
    }, []);

    const startRecording = useCallback(async (stream: MediaStream): Promise<void> => {
        if (isRecording) {
            console.warn('Recording is already in progress');
            return;
        }

        try {
            const recorder = new MediabunnyRecorder(recordingOptions);

            recorder.onstart = () => {
                setIsRecording(true);
                setIsPaused(false);
                startTimeRef.current = Date.now();
                onRecordingStart?.();
            };

            recorder.onerror = (error: any) => {
                setIsRecording(false);
                setIsPaused(false);
                onError?.(error);
            };

            recorder.onpause = () => {
                setIsPaused(true);
                onPause?.();
            };

            recorder.onresume = () => {
                setIsPaused(false);
                onResume?.();
            };

            recorderRef.current = recorder;
            currentStreamRef.current = stream;

            await recorder.start(stream);
        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsRecording(false);
            onError?.(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }, [isRecording, recordingOptions, onRecordingStart, onError, onPause, onResume]);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        if (!recorderRef.current || !isRecording) {
            console.warn('No recording in progress');
            return null;
        }

        try {
            const blob = await recorderRef.current.stop();

            setIsRecording(false);
            setIsPaused(false);
            currentStreamRef.current = null;

            if (blob) {
                // Add to segments
                setSegments(prev => [...prev, blob]);
                onRecordingStop?.(blob);
            }

            return blob;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            onError?.(error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }, [isRecording, onRecordingStop, onError]);

    const pauseRecording = useCallback((): void => {
        if (!recorderRef.current || !isRecording || isPaused) {
            return;
        }
        recorderRef.current.pause();
    }, [isRecording, isPaused]);

    const resumeRecording = useCallback((): void => {
        if (!recorderRef.current || !isRecording || !isPaused) {
            return;
        }
        recorderRef.current.resume();
    }, [isRecording, isPaused]);

    const cancelRecording = useCallback(async (): Promise<void> => {
        if (!recorderRef.current) {
            return;
        }

        await recorderRef.current.cancel();
        setIsRecording(false);
        setIsPaused(false);
        currentStreamRef.current = null;
    }, []);

    const getStatus = useCallback((): RecordingStatus => {
        if (!recorderRef.current) {
            return {
                isRecording: false,
                isPaused: false,
                estimatedSize: 0,
                state: null,
                startTime: null,
            };
        }
        return recorderRef.current.getStatus();
    }, []);

    const getRecordingBlobs = useCallback((): Blob[] => {
        const blobs = [...segments];

        // Add current recording blob if available
        const currentBlob = recorderRef.current?.getBlob();
        if (currentBlob) {
            blobs.push(currentBlob);
        }

        return blobs;
    }, [segments]);

    const clearRecording = useCallback((): void => {
        setSegments([]);
        startTimeRef.current = null;
    }, []);

    const downloadRecording = useCallback(async (baseFilename?: string): Promise<boolean> => {
        const blobs = getRecordingBlobs();

        if (blobs.length === 0) {
            console.warn('No recorded data available');
            return false;
        }

        try {
            const zip = new JSZip();
            const extension = 'mp4';

            // Add all segments to the ZIP
            blobs.forEach((blob, index) => {
                const filename = blobs.length === 1
                    ? `recording.${extension}`
                    : `part${index + 1}.${extension}`;
                zip.file(filename, blob);
            });

            // Generate ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });

            // Create download link
            const timestamp = (startTimeRef.current
                ? new Date(startTimeRef.current)
                : new Date()
            ).toISOString().replace(/[:.]/g, '-');
            const filename = baseFilename || `recording-${timestamp}`;

            const url = URL.createObjectURL(zipBlob);
            const anchor = document.createElement('a');
            anchor.style.display = 'none';
            anchor.href = url;
            anchor.download = `${filename}.zip`;
            document.body.appendChild(anchor);
            anchor.click();

            setTimeout(() => {
                if (anchor.parentNode) {
                    document.body.removeChild(anchor);
                }
                URL.revokeObjectURL(url);
            }, 100);

            console.log(`Recording downloaded: ${filename}.zip`);
            return true;
        } catch (error) {
            console.error('Failed to download recording:', error);
            onError?.(error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }, [getRecordingBlobs, onError]);

    return {
        isRecording,
        isPaused,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        cancelRecording,
        getStatus,
        getRecordingBlobs,
        clearRecording,
        downloadRecording,
        mimeType: 'video/mp4',
        segments,
    };
}

export default useMediabunnyRecording;