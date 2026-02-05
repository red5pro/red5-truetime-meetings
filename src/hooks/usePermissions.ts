// hooks/usePermissions.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import log from 'loglevel';

// Type definitions
type PermissionState = 'granted' | 'denied' | 'prompt';
type MediaType = 'camera' | 'microphone';

interface MediaPermissions {
    cameraPermission: PermissionState;
    microphonePermission: PermissionState;
}

interface PermissionObjects {
    camera: PermissionStatus | null;
    microphone: PermissionStatus | null;
}

interface MediaTrackConstraints {
    audio?: boolean;
    video?: boolean;
}

interface UsePermissionsReturn {
    // Permission states
    cameraPermissionState: PermissionState;
    microphonePermissionState: PermissionState;
    isPermissionDialogVisible: boolean;

    // Setters
    setCameraPermissionState: React.Dispatch<React.SetStateAction<PermissionState>>;
    setMicrophonePermissionState: React.Dispatch<React.SetStateAction<PermissionState>>;
    setIsPermissionDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;

    // Methods
    updatePermissions: () => Promise<MediaPermissions>;
    requestPermissions: (constraints?: MediaTrackConstraints) => Promise<boolean>;
    arePermissionsGranted: () => boolean;
    arePermissionsDenied: () => boolean;
    shouldShowPermissionDialog: () => boolean;
    getPermissionStatus: (mediaType: MediaType) => PermissionState;
    handlePermissionDialogClose: () => void;
}

export const usePermissions = (isPlayOnly: boolean = false): UsePermissionsReturn => {
    const [cameraPermissionState, setCameraPermissionState] = useState<PermissionState>('prompt');
    const [microphonePermissionState, setMicrophonePermissionState] = useState<PermissionState>('prompt');
    const [isPermissionDialogVisible, setIsPermissionDialogVisible] = useState<boolean>(false);
    const [permissionObjects, setPermissionObjects] = useState<PermissionObjects>({
        camera: null,
        microphone: null
    });

    // Use ref to track if we've initialized
    const hasInitializedRef = useRef(false);

    /**
     * Check and update media permissions
     */
    const updatePermissions = useCallback(async (): Promise<MediaPermissions> => {
        try {
            // Query camera permission
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

            // Update states
            setCameraPermissionState(cameraPermission.state);
            setMicrophonePermissionState(microphonePermission.state);

            // Store permission objects for monitoring
            setPermissionObjects({
                camera: cameraPermission,
                microphone: microphonePermission
            });

            // Set up change listeners
            cameraPermission.onchange = () => {
                log.log('Camera permission changed to:', cameraPermission.state);
                setCameraPermissionState(cameraPermission.state);
            };

            microphonePermission.onchange = () => {
                log.log('Microphone permission changed to:', microphonePermission.state);
                setMicrophonePermissionState(microphonePermission.state);
            };

            log.log('Permissions updated - Camera:', cameraPermission.state, 'Microphone:', microphonePermission.state);

            return {
                cameraPermission: cameraPermission.state,
                microphonePermission: microphonePermission.state
            };
        } catch (err) {
            log.error('Permission check error:', err);
            // Default to prompt if permission API is not available
            return {
                cameraPermission: 'prompt',
                microphonePermission: 'prompt'
            };
        }
    }, []);

    /**
     * Request media permissions
     */
    const requestPermissions = useCallback(async (constraints: MediaTrackConstraints = { audio: true, video: true }): Promise<boolean> => {
        try {
            log.log('Requesting media permissions...');

            // Request getUserMedia to trigger permission prompt
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Stop all tracks immediately after getting permission
            stream.getTracks().forEach(track => {
                track.stop();
                log.log(`Stopped ${track.kind} track after permission request`);
            });

            // Update permission states
            await updatePermissions();

            log.log('Media permissions granted');
            return true;
        } catch (error) {
            log.error('Failed to get media permissions:', error);

            // Update permission states even on failure
            await updatePermissions();

            // Determine which permission was denied
            if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
                return false;
            }

            throw error;
        }
    }, [updatePermissions]);

    /**
     * Check if permissions are granted
     */
    const arePermissionsGranted = useCallback((): boolean => {
        return cameraPermissionState === 'granted' && microphonePermissionState === 'granted';
    }, [cameraPermissionState, microphonePermissionState]);

    /**
     * Check if permissions are denied
     */
    const arePermissionsDenied = useCallback((): boolean => {
        return cameraPermissionState === 'denied' || microphonePermissionState === 'denied';
    }, [cameraPermissionState, microphonePermissionState]);

    /**
     * Check if should show permission dialog
     */
    const shouldShowPermissionDialog = useCallback((): boolean => {
        if (isPlayOnly) return false;
        return cameraPermissionState !== 'granted' || microphonePermissionState !== 'granted';
    }, [isPlayOnly, cameraPermissionState, microphonePermissionState]);

    /**
     * Get permission status for a specific media type
     */
    const getPermissionStatus = useCallback((mediaType: MediaType): PermissionState => {
        if (mediaType === 'camera') {
            return cameraPermissionState;
        } else if (mediaType === 'microphone') {
            return microphonePermissionState;
        }
        return 'prompt';
    }, [cameraPermissionState, microphonePermissionState]);

    /**
     * Handle permission dialog close
     */
    const handlePermissionDialogClose = useCallback((): void => {
        setIsPermissionDialogVisible(false);
    }, []);

    /**
     * Initialize permissions on mount
     */
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        const initPermissions = async (): Promise<void> => {
            try {
                await updatePermissions();
            } catch (err) {
                log.error('Failed to initialize permissions:', err);
            }
        };

        initPermissions();
    }, [updatePermissions]);

    /**
     * Update dialog visibility based on permission states
     */
    useEffect(() => {
        if (isPlayOnly) {
            setIsPermissionDialogVisible(false);
            return;
        }

        // Inline the logic instead of calling shouldShowPermissionDialog to avoid function dependency
        const shouldShow = cameraPermissionState !== 'granted' || microphonePermissionState !== 'granted';
        setIsPermissionDialogVisible(shouldShow);
    }, [cameraPermissionState, microphonePermissionState, isPlayOnly]);

    /**
     * Cleanup permission listeners
     */
    useEffect(() => {
        return () => {
            // Clean up permission change listeners
            if (permissionObjects.camera) {
                permissionObjects.camera.onchange = null;
            }
            if (permissionObjects.microphone) {
                permissionObjects.microphone.onchange = null;
            }
        };
    }, [permissionObjects]);

    return {
        // Permission states
        cameraPermissionState,
        microphonePermissionState,
        isPermissionDialogVisible,

        // Setters
        setCameraPermissionState,
        setMicrophonePermissionState,
        setIsPermissionDialogVisible,

        // Methods
        updatePermissions,
        requestPermissions,
        arePermissionsGranted,
        arePermissionsDenied,
        shouldShowPermissionDialog,
        getPermissionStatus,
        handlePermissionDialogClose
    };
};