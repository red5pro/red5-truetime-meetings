// hooks/useKeyboardShortcuts.ts

import { useState, useCallback, useEffect, useRef } from 'react';

// Type definitions
interface KeyboardShortcutsConfig {
    onToggleCaptions?: () => void;
    onToggleMic?: (muted: boolean) => void;
    isCurrentlyMuted?: boolean;
    enableTapToTalk?: boolean;
    enableCaptionsToggle?: boolean;
}

interface UseKeyboardShortcutsReturn {
    // Tap-to-talk state
    isSpacePressed: boolean;
    isTapToTalkActive: boolean;
    wasMutedBeforeTalk: boolean;

    // Helper functions
    resetTapToTalk: () => void;
    setIsTapToTalkEnabled: React.Dispatch<React.SetStateAction<boolean>>;

    // Status
    isKeyboardListenerActive: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts in the meeting room
 * @param config - Configuration object
 * @param config.onToggleCaptions - Function to toggle captions
 * @param config.onToggleMic - Function to toggle microphone
 * @param config.isCurrentlyMuted - Current mute state
 * @param config.enableTapToTalk - Whether to enable tap-to-talk feature
 * @param config.enableCaptionsToggle - Whether to enable captions toggle
 * @returns Hook state and functions
 */
export const useKeyboardShortcuts = ({
                                         onToggleCaptions,
                                         onToggleMic,
                                         isCurrentlyMuted = false,
                                         enableTapToTalk = true,
                                         enableCaptionsToggle = true
                                     }: KeyboardShortcutsConfig = {}): UseKeyboardShortcutsReturn => {
    // Tap to talk state
    const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
    const [wasMutedBeforeTalk, setWasMutedBeforeTalk] = useState<boolean>(false);
    const [isTapToTalkEnabled, setIsTapToTalkEnabled] = useState<boolean>(enableTapToTalk);

    // Use refs to store latest function references and state values without triggering re-renders
    const onToggleCaptionsRef = useRef(onToggleCaptions);
    const onToggleMicRef = useRef(onToggleMic);
    const isCurrentlyMutedRef = useRef(isCurrentlyMuted);
    const isSpacePressedRef = useRef(isSpacePressed);
    const wasMutedBeforeTalkRef = useRef(wasMutedBeforeTalk);

    // Keep refs up to date
    useEffect(() => {
        onToggleCaptionsRef.current = onToggleCaptions;
    }, [onToggleCaptions]);

    useEffect(() => {
        onToggleMicRef.current = onToggleMic;
    }, [onToggleMic]);

    useEffect(() => {
        isCurrentlyMutedRef.current = isCurrentlyMuted;
    }, [isCurrentlyMuted]);

    useEffect(() => {
        isSpacePressedRef.current = isSpacePressed;
    }, [isSpacePressed]);

    useEffect(() => {
        wasMutedBeforeTalkRef.current = wasMutedBeforeTalk;
    }, [wasMutedBeforeTalk]);

    // Check if user is typing in an input field
    const isInputFocused = useCallback((target: EventTarget | null): boolean => {
        if (!target || !(target instanceof Element)) return false;

        return target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.getAttribute('contenteditable') === 'true' ||
            target.getAttribute('role') === 'textbox';
    }, []);

    // Handle key down events
    const handleKeyDown = useCallback((event: KeyboardEvent): void => {
        if (isInputFocused(event.target)) return;

        // Handle C key for captions toggle
        if (enableCaptionsToggle && (event.key === 'c' || event.key === 'C')) {
            event.preventDefault();
            onToggleCaptionsRef.current?.();
            console.log('Captions toggled via keyboard shortcut');
        }

        // Handle Space key for tap-to-talk (keydown - when pressed)
        if (isTapToTalkEnabled && event.code === 'Space' && !isSpacePressedRef.current) {
            event.preventDefault();
            setIsSpacePressed(true);

            // If currently muted, unmute for talking
            if (isCurrentlyMutedRef.current) {
                setWasMutedBeforeTalk(true);
                onToggleMicRef.current?.(false);
                console.log('Tap-to-talk: Unmuted');
            }
        }
    }, [isInputFocused, enableCaptionsToggle, isTapToTalkEnabled]);

    // Handle key up events
    const handleKeyUp = useCallback((event: KeyboardEvent): void => {
        if (isInputFocused(event.target)) return;

        // Handle Space key for tap-to-talk (keyup - when released)
        if (enableTapToTalk && event.code === 'Space' && isSpacePressedRef.current) {
            event.preventDefault();
            setIsSpacePressed(false);

            // If was muted before talking, mute again
            if (wasMutedBeforeTalkRef.current) {
                onToggleMicRef.current?.(true);
                setWasMutedBeforeTalk(false);
                console.log('Tap-to-talk: Muted again');
            }
        }
    }, [isInputFocused, enableTapToTalk]);

    // Reset tap-to-talk state when mute state changes externally
    useEffect(() => {
        if (!isCurrentlyMuted && wasMutedBeforeTalk && !isSpacePressed) {
            setWasMutedBeforeTalk(false);
        }
    }, [isCurrentlyMuted, wasMutedBeforeTalk, isSpacePressed]);

    // Add and remove event listeners
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Log available shortcuts on mount
        console.log('🎯 Keyboard Shortcuts Active:');
        if (enableCaptionsToggle) console.log('  C - Toggle Captions');
        if (enableTapToTalk) console.log('  Space - Tap to Talk');

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp, enableCaptionsToggle, enableTapToTalk]);

    // Cleanup function to reset state
    const resetTapToTalk = useCallback((): void => {
        setIsSpacePressed(false);
        setWasMutedBeforeTalk(false);
    }, []);

    return {
        // Tap-to-talk state
        isSpacePressed,
        isTapToTalkActive: isSpacePressed,
        wasMutedBeforeTalk,

        // Helper functions
        resetTapToTalk,
        setIsTapToTalkEnabled,

        // Status
        isKeyboardListenerActive: true
    };
};

export default useKeyboardShortcuts;