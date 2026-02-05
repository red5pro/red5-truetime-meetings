// hooks/useMediaControls.ts
import { useState, useCallback } from 'react';

// Type definitions
interface Client {
    muteAudio: (mute: boolean) => Promise<void>;
    muteVideo: (mute: boolean) => Promise<void>;
}

interface UseMediaControlsReturn {
    isMyCamTurnedOff: boolean;
    setIsMyCamTurnedOff: React.Dispatch<React.SetStateAction<boolean>>;
    isMyMicMuted: boolean;
    setIsMyMicMuted: React.Dispatch<React.SetStateAction<boolean>>;
    microphoneButtonDisabled: boolean;
    setMicrophoneButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
    cameraButtonDisabled: boolean;
    setCameraButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
    toggleMic: (mute: boolean) => void;
    toggleCamera: (mute: boolean) => void;
}

export const useMediaControls = (client: Client): UseMediaControlsReturn => {
    const [isMyCamTurnedOff, setIsMyCamTurnedOff] = useState<boolean>(false);
    const [isMyMicMuted, setIsMyMicMuted] = useState<boolean>(false);
    const [microphoneButtonDisabled, setMicrophoneButtonDisabled] = useState<boolean>(false);
    const [cameraButtonDisabled, setCameraButtonDisabled] = useState<boolean>(false);

    const toggleMic = useCallback((mute: boolean): void => {
        client.muteAudio(mute).then(() => {
            setIsMyMicMuted(mute);
        }).catch((error) => {
            console.error('Failed to toggle microphone:', error);
        });
    }, [client]);

    const toggleCamera = useCallback((mute: boolean): void => {
        client.muteVideo(mute).then(() => {
            setIsMyCamTurnedOff(mute);
        }).catch((error) => {
            console.error('Failed to toggle camera:', error);
        });
    }, [client]);

    return {
        isMyCamTurnedOff,
        setIsMyCamTurnedOff,
        isMyMicMuted,
        setIsMyMicMuted,
        microphoneButtonDisabled,
        setMicrophoneButtonDisabled,
        cameraButtonDisabled,
        setCameraButtonDisabled,
        toggleMic,
        toggleCamera
    };
};