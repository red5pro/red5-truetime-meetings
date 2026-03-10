// hooks/useParticipants.ts
import { useState, useRef, useCallback, MutableRefObject } from 'react';

// Type definitions
interface Participant {
  streamId: string;
  name?: string;
  streamName?: string;
  // Add other participant properties as needed based on your implementation
}

interface Participants {
  [streamId: string]: Participant;
}

interface SubscribedParticipants {
  [streamId: string]: any; // Define more specific type based on your subscription data structure
}

interface TalkerAudioLevels {
  [streamId: string]: number;
}

interface SubscribeAttemptEntry {
  retryCount: number;
  inProgress: boolean;
}

interface SubscribeAttempts {
  [streamId: string]: SubscribeAttemptEntry;
}

interface UseParticipantsReturn {
  participants: Participants;
  setParticipants: React.Dispatch<React.SetStateAction<Participants>>;
  findParticipantName: (streamId: string) => string;
  subscribedParticipants: SubscribedParticipants;
  setSubscribedParticipants: React.Dispatch<React.SetStateAction<SubscribedParticipants>>;
  pinnedParticipantId: string | null;
  setPinnedParticipantId: React.Dispatch<React.SetStateAction<string | null>>;
  talkers: string[];
  setTalkers: React.Dispatch<React.SetStateAction<string[]>>;
  raisedHands: string[];
  setRaisedHands: React.Dispatch<React.SetStateAction<string[]>>;
  subscribeAttemptsRef: MutableRefObject<SubscribeAttempts>;
  retryTimeoutsRef: MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  talkerAudioLevelsRef: MutableRefObject<TalkerAudioLevels>;
  pinnedParticipantIdRef: MutableRefObject<string | null>;
  updateTalkerLevel: (userId: string, level: number) => void;
  clearParticipant: (streamId: string) => void;
  guestParticipantRequestList: string[];
  setGuestParticipantRequestList: React.Dispatch<React.SetStateAction<string[]>>;
  guestsWaitingApproval: Participants;
  setGuestsWaitingApproval: React.Dispatch<React.SetStateAction<Participants>>;
}

export const useParticipants = (): UseParticipantsReturn => {
  const [participants, setParticipants] = useState<Participants>({});
  const [subscribedParticipants, setSubscribedParticipants] = useState<SubscribedParticipants>({});
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [talkers, setTalkers] = useState<string[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const subscribeAttemptsRef = useRef<SubscribeAttempts>({});
  const retryTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const talkerAudioLevelsRef = useRef<TalkerAudioLevels>({});
  const pinnedParticipantIdRef = useRef<string | null>(null);

  // Use ref to store participants to avoid recreating findParticipantName on every participant change
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  const findParticipantName = useCallback((streamId: string): string => {
    const participant = participantsRef.current[streamId];
    return participant?.name || participant?.streamName || 'Unknown';
  }, []);

  const updateTalkers = useCallback((): void => {
    const updatedTalkers = Object.keys(talkerAudioLevelsRef.current).filter(
      (streamId) => talkerAudioLevelsRef.current[streamId] > 75,
    );
    setTalkers(updatedTalkers);
  }, []);

  const updateTalkerLevel = useCallback(
    (userId: string, level: number): void => {
      talkerAudioLevelsRef.current = {
        ...talkerAudioLevelsRef.current,
        [userId]: level,
      };
      updateTalkers();
    },
    [updateTalkers],
  );

  const [guestParticipantRequestList, setGuestParticipantRequestList] = useState<string[]>([]);
  const [guestsWaitingApproval, setGuestsWaitingApproval] = useState<Participants>({});

  const clearParticipant = useCallback((streamId: string): void => {
    setParticipants((prev) => {
      const newParticipants = { ...prev };
      delete newParticipants[streamId];
      return newParticipants;
    });

    setSubscribedParticipants((prev) => {
      const newSubscribed = { ...prev };
      delete newSubscribed[streamId];
      return newSubscribed;
    });

    const newTalkers = { ...talkerAudioLevelsRef.current };
    delete newTalkers[streamId];
    talkerAudioLevelsRef.current = newTalkers;
  }, []);

  return {
    participants,
    setParticipants,
    guestParticipantRequestList,
    setGuestParticipantRequestList,
    findParticipantName,
    subscribedParticipants,
    setSubscribedParticipants,
    pinnedParticipantId,
    setPinnedParticipantId,
    talkers,
    setTalkers,
    raisedHands,
    setRaisedHands,
    subscribeAttemptsRef,
    retryTimeoutsRef,
    talkerAudioLevelsRef,
    pinnedParticipantIdRef,
    updateTalkerLevel,
    clearParticipant,
    guestsWaitingApproval,
    setGuestsWaitingApproval,
  };
};
