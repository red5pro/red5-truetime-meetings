// hooks/useDrawerStates.ts
import { useState } from 'react';

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

  const closeAllDrawers = (): void => {
    setInfoDrawerOpen(false);
    setMessageDrawerOpen(false);
    setParticipantListDrawerOpen(false);
    setEffectsDrawerOpen(false);
    setLocalRecordingDrawerOpen(false);
    setTranscriptionDrawerOpen(false);
    setExternalStreamsDrawerOpen(false);
  };

  const handleInfoDrawerOpen = (open: boolean): void => {
    if (open) closeAllDrawers();
    setInfoDrawerOpen(open);
  };

  const handleMessageDrawerOpen = (open: boolean): void => {
    if (open) closeAllDrawers();
    setMessageDrawerOpen(open);
  };

  const handleParticipantListOpen = (open: boolean): void => {
    if (open) closeAllDrawers();
    setParticipantListDrawerOpen(open);
  };

  const handleEffectsOpen = (open: boolean): void => {
    if (open) closeAllDrawers();
    setEffectsDrawerOpen(open);
  };

  const handleLocalRecordingDrawerOpen = (open: boolean): void => {
    if (open) closeAllDrawers();
    setLocalRecordingDrawerOpen(open);
  };

  const handleTranscriptionDrawerOpen = (open: boolean): void => {
    if (open) closeAllDrawers();
    setTranscriptionDrawerOpen(open);
  };

  const handleExternalStreamsDrawerOpen = (open: boolean): void => {
    if (open) closeAllDrawers();
    setExternalStreamsDrawerOpen(open);
  };

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
