// hooks/useVirtualBackground.ts

import { useState, useCallback, useEffect, useRef, MutableRefObject } from 'react';
import { getVirtualBackgroundConfigs } from '../utils/conferenceConfig';
import { VirtualBackgroundTypes } from "red5pro-conference-sdk";
import log from 'loglevel';

// Type definitions
type VirtualBackgroundType = 'none' | 'blur' | 'slight-blur' | 'color' | 'image';

interface VirtualBackgroundEventData {
    type: VirtualBackgroundType;
    error?: string;
}

interface VirtualBackgroundStatus {
    isInitialized: boolean;
    isEnabled: boolean;
    backgroundType: VirtualBackgroundType;
}

interface VirtualBackgroundConfig {
    type: VirtualBackgroundType;
    options: {
        imageUrl?: string;
        color?: string;
        blurAmount?: number;
    };
}

interface VirtualBackgroundConfigs {
    [key: string]: VirtualBackgroundConfig;
}

interface VirtualBackgroundOption {
    type: VirtualBackgroundType;
    value?: string | null;
}

interface VirtualBackgroundOptions {
    value?: string;
}

interface ConferenceClient {
    on: (event: string, handler: (data?: any) => void) => void;
    off: (event: string, handler: (data?: any) => void) => void;
    getVirtualBackgroundStatus: () => VirtualBackgroundStatus;
    initializeVirtualBackground: () => Promise<void>;
    disableVirtualBackground: () => Promise<void>;
    enableVirtualBackground: (type: VirtualBackgroundType, options?: any) => Promise<void>;
    changeVirtualBackground: (type: VirtualBackgroundType, options?: any) => Promise<void>;
}

interface UseVirtualBackgroundReturn {
    selectedBackgroundMode: string;
    setSelectedBackgroundMode: React.Dispatch<React.SetStateAction<string>>;
    isVirtualBackgroundInitialized: boolean;
    isVirtualBackgroundEnabled: boolean;
    currentBackgroundType: VirtualBackgroundType;
    initializeVirtualBackground: () => Promise<boolean>;
    setVirtualBackgroundImage: (options?: VirtualBackgroundOptions) => Promise<boolean>;
    handleBackgroundReplacement: (option: VirtualBackgroundOption) => Promise<boolean>;
    disableVirtualBackground: () => Promise<boolean>;
    getVirtualBackgroundStatus: () => VirtualBackgroundStatus;
    applyBlurBackground: (blurAmount?: number) => Promise<boolean>;
    applyColorBackground: (color: string) => Promise<boolean>;
    applyImageBackground: (imageUrl: string) => Promise<boolean>;
}

export const useVirtualBackground = (
    conferenceClientRef: MutableRefObject<ConferenceClient | null>,
    isCameraOff: boolean,
    showWarning?: (message: string) => void
): UseVirtualBackgroundReturn => {
    const [selectedBackgroundMode, setSelectedBackgroundMode] = useState<string>('');
    const [isVirtualBackgroundInitialized, setIsVirtualBackgroundInitialized] = useState<boolean>(false);
    const [isVirtualBackgroundEnabled, setIsVirtualBackgroundEnabled] = useState<boolean>(false);
    // @ts-ignore
    const [currentBackgroundType, setCurrentBackgroundType] = useState<VirtualBackgroundType>(VirtualBackgroundTypes.NONE);

    // Use ref to store latest function reference without triggering re-renders
    const showWarningRef = useRef(showWarning);

    // Keep ref up to date
    useEffect(() => {
        showWarningRef.current = showWarning;
    }, [showWarning]);

    // Setup event handlers
    useEffect(() => {
        if (!conferenceClientRef?.current) return;

        const handleInitialized = (): void => {
            log.log('Virtual background initialized');
            setIsVirtualBackgroundInitialized(true);
        };

        const handleEnabled = (data: VirtualBackgroundEventData): void => {
            log.log('Virtual background enabled:', data.type);
            setIsVirtualBackgroundEnabled(true);
            setCurrentBackgroundType(data.type);
            if (showWarningRef.current) {
                showWarningRef.current(`Virtual background effect ${data.type} enabled`);
            }
        };

        const handleDisabled = (): void => {
            log.log('Virtual background disabled');
            setIsVirtualBackgroundEnabled(false);
            // @ts-ignore
            setCurrentBackgroundType(VirtualBackgroundTypes.NONE);
            if (showWarningRef.current) {
                showWarningRef.current('Virtual background disabled');
            }
        };

        const handleChanged = (data: VirtualBackgroundEventData): void => {
            log.log('Virtual background changed:', data.type);
            setCurrentBackgroundType(data.type);
            if (showWarningRef.current) {
                showWarningRef.current(`Virtual background effect ${data.type} enabled`);
            }
        };

        const handleEnableFailed = (data: VirtualBackgroundEventData): void => {
            log.error('Virtual background enable failed:', data);
            if (showWarningRef.current && data.error) {
                showWarningRef.current('Virtual background failed: ' + data.error);
            }
        };

        conferenceClientRef.current.on('virtual-background-initialized', handleInitialized);
        conferenceClientRef.current.on('virtual-background-enabled', handleEnabled);
        conferenceClientRef.current.on('virtual-background-disabled', handleDisabled);
        conferenceClientRef.current.on('virtual-background-changed', handleChanged);
        conferenceClientRef.current.on('virtual-background-enable-failed', handleEnableFailed);

        return () => {
            if (conferenceClientRef?.current) {
                conferenceClientRef.current.off('virtual-background-initialized', handleInitialized);
                conferenceClientRef.current.off('virtual-background-enabled', handleEnabled);
                conferenceClientRef.current.off('virtual-background-disabled', handleDisabled);
                conferenceClientRef.current.off('virtual-background-changed', handleChanged);
                conferenceClientRef.current.off('virtual-background-enable-failed', handleEnableFailed);
            }
        };
    }, [conferenceClientRef]);

    /**
     * Initialize virtual background if needed
     */
    const initializeVirtualBackground = useCallback(async (): Promise<boolean> => {
        if (!conferenceClientRef?.current) {
            log.error('Conference client not initialized');
            return false;
        }

        try {
            const status = conferenceClientRef.current.getVirtualBackgroundStatus();

            if (!status.isInitialized) {
                await conferenceClientRef.current.initializeVirtualBackground();
                log.log('Virtual background initialized');
                setIsVirtualBackgroundInitialized(true);
            }

            return true;
        } catch (error) {
            log.error('Failed to initialize virtual background:', error);
            return false;
        }
    }, [conferenceClientRef]);

    /**
     * Fetch image as blob URL
     */
    const fetchImageAsBlob = useCallback(async (url: string): Promise<string> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            log.error('Failed to fetch image:', error);
            throw error;
        }
    }, []);

    /**
     * Handle background replacement
     */
    const handleBackgroundReplacement = useCallback(async (option: VirtualBackgroundOption): Promise<boolean> => {
        if (!conferenceClientRef?.current) {
            log.error('Conference client not initialized');
            return false;
        }

        // Check if camera is off
        if (isCameraOff) {
            if (showWarningRef.current) {
                showWarningRef.current('Turn on your camera to use virtual backgrounds.');
            }
            return false;
        }

        try {
            // Initialize if needed
            await initializeVirtualBackground();

            const { type, value } = option;

            // Handle disable case
            if (type === VirtualBackgroundTypes.NONE) {
                await conferenceClientRef.current.disableVirtualBackground();
                setSelectedBackgroundMode('');
                return true;
            }

            // Get current status
            const effectStatus = conferenceClientRef.current.getVirtualBackgroundStatus();
            const shouldEnable = effectStatus.backgroundType === VirtualBackgroundTypes.NONE && !effectStatus.isEnabled;
            const action = shouldEnable ? 'enableVirtualBackground' : 'changeVirtualBackground';

            // Get configuration for the background type
            // @ts-ignore
            const configs: VirtualBackgroundConfigs = getVirtualBackgroundConfigs();
            let config = configs[type];

            if (!config) {
                log.error(`Unknown background type: ${type}`);
                return false;
            }

            // Update config with dynamic values
            if (type === 'image' && value) {
                config = { ...config, options: { ...config.options, imageUrl: value } };
            } else if (type === 'color' && value) {
                config = { ...config, options: { ...config.options, color: value } };
            }

            // Apply the background
            await conferenceClientRef.current[action](config.type, config.options);
            setSelectedBackgroundMode(type);

            log.log(`Virtual background ${action} successful: ${type}`);
            return true;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            log.error('Failed to handle background replacement:', error);
            if (showWarningRef.current) {
                showWarningRef.current('Failed to apply virtual background: ' + errorMessage);
            }
            return false;
        }
    }, [conferenceClientRef, isCameraOff, initializeVirtualBackground]);

    /**
     * Set virtual background image
     */
    const setVirtualBackgroundImage = useCallback(async (options?: VirtualBackgroundOptions): Promise<boolean> => {
        const url = options?.value;

        if (!url || url === '') {
            log.warn('No image URL provided');
            return false;
        }

        try {
            let imageUrl = url;

            // Convert to blob URL if not already a data URL
            if (!url.startsWith('data:image')) {
                imageUrl = await fetchImageAsBlob(url);
            }

            await handleBackgroundReplacement({ type: 'image', value: imageUrl });
            return true;
        } catch (error) {
            log.error('Failed to set virtual background image:', error);
            return false;
        }
    }, [fetchImageAsBlob, handleBackgroundReplacement]);

    /**
     * Disable virtual background
     */
    const disableVirtualBackground = useCallback(async (): Promise<boolean> => {
        if (!conferenceClientRef?.current) return false;

        try {
            await conferenceClientRef.current.disableVirtualBackground();
            setSelectedBackgroundMode('');
            setIsVirtualBackgroundEnabled(false);
            // @ts-ignore
            setCurrentBackgroundType(VirtualBackgroundTypes.NONE);
            log.log('Virtual background disabled');
            return true;
        } catch (error) {
            log.error('Failed to disable virtual background:', error);
            return false;
        }
    }, [conferenceClientRef]);

    /**
     * Get virtual background status
     */
    const getVirtualBackgroundStatus = useCallback((): VirtualBackgroundStatus => {
        if (!conferenceClientRef?.current) {
            return {
                isInitialized: false,
                isEnabled: false,
                // @ts-ignore
                backgroundType: VirtualBackgroundTypes.NONE
            };
        }

        try {
            const status = conferenceClientRef.current.getVirtualBackgroundStatus();
            return {
                isInitialized: status.isInitialized || isVirtualBackgroundInitialized,
                isEnabled: status.isEnabled || isVirtualBackgroundEnabled,
                backgroundType: status.backgroundType || currentBackgroundType
            };
        } catch (error) {
            log.error('Failed to get virtual background status:', error);
            return {
                isInitialized: isVirtualBackgroundInitialized,
                isEnabled: isVirtualBackgroundEnabled,
                backgroundType: currentBackgroundType
            };
        }
    }, [conferenceClientRef, isVirtualBackgroundInitialized, isVirtualBackgroundEnabled, currentBackgroundType]);

    /**
     * Apply blur background
     */
    const applyBlurBackground = useCallback(async (blurAmount: number = 50): Promise<boolean> => {
        const type: VirtualBackgroundType = blurAmount === 10 ? 'slight-blur' : 'blur';
        return await handleBackgroundReplacement({ type, value: null });
    }, [handleBackgroundReplacement]);

    /**
     * Apply color background
     */
    const applyColorBackground = useCallback(async (color: string): Promise<boolean> => {
        return await handleBackgroundReplacement({ type: 'color', value: color });
    }, [handleBackgroundReplacement]);

    /**
     * Apply image background
     */
    const applyImageBackground = useCallback(async (imageUrl: string): Promise<boolean> => {
        return await handleBackgroundReplacement({ type: 'image', value: imageUrl });
    }, [handleBackgroundReplacement]);

    return {
        selectedBackgroundMode,
        setSelectedBackgroundMode,
        isVirtualBackgroundInitialized,
        isVirtualBackgroundEnabled,
        currentBackgroundType,
        initializeVirtualBackground,
        setVirtualBackgroundImage,
        handleBackgroundReplacement,
        disableVirtualBackground,
        getVirtualBackgroundStatus,
        applyBlurBackground,
        applyColorBackground,
        applyImageBackground
    };
};