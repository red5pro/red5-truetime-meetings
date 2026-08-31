// hooks/useDrawerStates.ts
import { useState, useCallback } from 'react';

// Type definitions
interface UseDrawerStatesReturn {
  infoDrawerOpen: boolean;
  messageDrawerOpen: boolean;
  setMessageDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  participantListDrawerOpen: boolean;
  effectsDrawerOpen: boolean;
  localRecordingDrawerOpen: boolean;
  transcriptionDrawerOpen: boolean;
  externalStreamsDrawerOpen: boolean;
  handleInfoDrawerOpen: (open: boolean) => void;
  handleMessageDrawerOpen: (open: boolean) => void;
  handleParticipantListOpen: (open: boolean) => void;
  handleEffectsOpen: (open: boolean) => void;
  handleLocalRecordingDrawerOpen: (open: boolean) => void;
  handleTranscriptionDrawerOpen: (open: boolean) => void;
  handleExternalStreamsDrawerOpen: (open: boolean) => void;
}

export const useDrawerStates = (): UseDrawerStatesReturn => {
  const [infoDrawerOpen, setInfoDrawerOpen] = useState<boolean>(false);
  const [messageDrawerOpen, setMessageDrawerOpen] = useState<boolean>(false);
  const [participantListDrawerOpen, setParticipantListDrawerOpen] = useState<boolean>(false);
  const [effectsDrawerOpen, setEffectsDrawerOpen] = useState<boolean>(false);
  const [localRecordingDrawerOpen, setLocalRecordingDrawerOpen] = useState<boolean>(false);
  const [transcriptionDrawerOpen, setTranscriptionDrawerOpen] = useState<boolean>(false);
  const [externalStreamsDrawerOpen, setExternalStreamsDrawerOpen] = useState<boolean>(false);

  const closeAllDrawers = useCallback((): void => {
    setInfoDrawerOpen(false);
    setMessageDrawerOpen(false);
    setParticipantListDrawerOpen(false);
    setEffectsDrawerOpen(false);
    setLocalRecordingDrawerOpen(false);
    setTranscriptionDrawerOpen(false);
    setExternalStreamsDrawerOpen(false);
  }, []);

  const handleInfoDrawerOpen = useCallback(
    (open: boolean): void => {
      if (open) closeAllDrawers();
      setInfoDrawerOpen(open);
    },
    [closeAllDrawers],
  );

  const handleMessageDrawerOpen = useCallback(
    (open: boolean): void => {
      if (open) closeAllDrawers();
      setMessageDrawerOpen(open);
    },
    [closeAllDrawers],
  );

  const handleParticipantListOpen = useCallback(
    (open: boolean): void => {
      if (open) closeAllDrawers();
      setParticipantListDrawerOpen(open);
    },
    [closeAllDrawers],
  );

  const handleEffectsOpen = useCallback(
    (open: boolean): void => {
      if (open) closeAllDrawers();
      setEffectsDrawerOpen(open);
    },
    [closeAllDrawers],
  );

  const handleLocalRecordingDrawerOpen = useCallback(
    (open: boolean): void => {
      if (open) closeAllDrawers();
      setLocalRecordingDrawerOpen(open);
    },
    [closeAllDrawers],
  );

  const handleTranscriptionDrawerOpen = useCallback(
    (open: boolean): void => {
      if (open) closeAllDrawers();
      setTranscriptionDrawerOpen(open);
    },
    [closeAllDrawers],
  );

  const handleExternalStreamsDrawerOpen = useCallback(
    (open: boolean): void => {
      if (open) closeAllDrawers();
      setExternalStreamsDrawerOpen(open);
    },
    [closeAllDrawers],
  );

  return {
    infoDrawerOpen,
    messageDrawerOpen,
    setMessageDrawerOpen,
    participantListDrawerOpen,
    effectsDrawerOpen,
    localRecordingDrawerOpen,
    transcriptionDrawerOpen,
    externalStreamsDrawerOpen,
    handleInfoDrawerOpen,
    handleMessageDrawerOpen,
    handleParticipantListOpen,
    handleEffectsOpen,
    handleLocalRecordingDrawerOpen,
    handleTranscriptionDrawerOpen,
    handleExternalStreamsDrawerOpen,
  };
};
