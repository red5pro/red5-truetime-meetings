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
  const { muteAudio, muteVideo } = client;
  const [isMyCamTurnedOff, setIsMyCamTurnedOff] = useState<boolean>(false);
  const [isMyMicMuted, setIsMyMicMuted] = useState<boolean>(false);
  const [microphoneButtonDisabled, setMicrophoneButtonDisabled] = useState<boolean>(false);
  const [cameraButtonDisabled, setCameraButtonDisabled] = useState<boolean>(false);

  const toggleMic = useCallback(
    (muteStatus: boolean): void => {
      muteAudio(muteStatus)
        .then(() => {
          setIsMyMicMuted(muteStatus);
        })
        .catch((error) => {
          console.error('Failed to toggle microphone:', error);
        });
    },
    [muteAudio],
  );

  const toggleCamera = useCallback(
    (muteStatus: boolean): void => {
      muteVideo(muteStatus)
        .then(() => {
          setIsMyCamTurnedOff(muteStatus);
        })
        .catch((error) => {
          console.error('Failed to toggle camera:', error);
        });
    },
    [muteVideo],
  );

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
    toggleCamera,
  };
};
