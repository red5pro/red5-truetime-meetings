// hooks/useParticipants.ts
import { useState, useRef, useCallback, MutableRefObject } from 'react';

// Type definitions
interface Participant {
  streamId: string;
  uid?: string;
  name?: string;
  streamName?: string;
  isFake?: boolean;
  [key: string]: any;
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

interface SubscribeAttempts {
  [streamId: string]: number;
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
  talkerAudioLevelsRef: MutableRefObject<TalkerAudioLevels>;
  pinnedParticipantIdRef: MutableRefObject<string | null>;
  updateTalkerLevel: (userId: string, level: number) => void;
  clearParticipant: (streamId: string) => void;
  guestParticipantRequestList: string[];
  setGuestParticipantRequestList: React.Dispatch<React.SetStateAction<string[]>>;
  guestsWaitingApproval: Participants;
  setGuestsWaitingApproval: React.Dispatch<React.SetStateAction<Participants>>;
  addFakeParticipant: () => void;
  removeFakeParticipant: () => void;
}

const FAKE_PARTICIPANT_NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
];

export const useParticipants = (): UseParticipantsReturn => {
  const [participants, setParticipants] = useState<Participants>({});
  const fakeParticipantCounterRef = useRef(0);
  const [subscribedParticipants, setSubscribedParticipants] = useState<SubscribedParticipants>({});
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [talkers, setTalkers] = useState<string[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const subscribeAttemptsRef = useRef<SubscribeAttempts>({});
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

  const addFakeParticipant = useCallback((): void => {
    fakeParticipantCounterRef.current += 1;
    const fakeId = `fake-participant-${fakeParticipantCounterRef.current}`;
    const fakeName =
      FAKE_PARTICIPANT_NAMES[
        (fakeParticipantCounterRef.current - 1) % FAKE_PARTICIPANT_NAMES.length
      ];
    setParticipants((prev) => ({
      ...prev,
      [fakeId]: {
        uid: fakeId,
        streamId: fakeId,
        name: fakeName,
        isFake: true,
        role: 'fake',
        audioEnabled: false,
        videoEnabled: false,
        isRaiseHand: false,
      },
    }));
  }, []);

  const removeFakeParticipant = useCallback((): void => {
    setParticipants((prev) => {
      const fakeKeys = Object.keys(prev).filter((key) => key.startsWith('fake-participant-'));
      if (fakeKeys.length === 0) return prev;
      const lastFakeKey = fakeKeys[fakeKeys.length - 1];
      const next = { ...prev };
      delete next[lastFakeKey];
      return next;
    });
  }, []);

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
    talkerAudioLevelsRef,
    pinnedParticipantIdRef,
    updateTalkerLevel,
    clearParticipant,
    guestsWaitingApproval,
    setGuestsWaitingApproval,
    addFakeParticipant,
    removeFakeParticipant,
  };
};
