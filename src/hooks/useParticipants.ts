// hooks/useParticipants.ts
import { useState, useRef, useCallback, useEffect, MutableRefObject } from 'react';

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
  resetTalkers: () => void;
  clearParticipant: (streamId: string) => void;
  guestParticipantRequestList: string[];
  setGuestParticipantRequestList: React.Dispatch<React.SetStateAction<string[]>>;
  guestsWaitingApproval: Participants;
  setGuestsWaitingApproval: React.Dispatch<React.SetStateAction<Participants>>;
  addFakeParticipant: () => void;
  removeFakeParticipant: () => void;
}

// One threshold, and a hold window so short dips between words don't blink the indicator.
// A lower "still speaking" threshold does not work here: the level decays gradually after
// speech stops, so it would keep re-arming the hold long after the person went quiet.
const SPEAKING_LEVEL = 75;
const SPEAKING_HOLD_MS = 800;
const SPEAKING_SWEEP_MS = 100;

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

  // streamId -> timestamp of the last sample loud enough to count as speech
  const speakingSinceRef = useRef<Record<string, number>>({});
  const talkersRef = useRef<string[]>([]);
  const sweepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only push a new array when the set of talkers actually changed, so consumers
  // don't re-render on every audio-level event.
  const commitTalkers = useCallback((): void => {
    const next = Object.keys(speakingSinceRef.current);
    const prev = talkersRef.current;

    if (next.length === prev.length && next.every((id) => prev.includes(id))) return;

    talkersRef.current = next;
    setTalkers(next);
  }, []);

  const stopSweep = useCallback((): void => {
    if (sweepTimerRef.current) {
      clearInterval(sweepTimerRef.current);
      sweepTimerRef.current = null;
    }
  }, []);

  // Drops talkers whose hold window expired (also covers users that stop sending levels).
  const startSweep = useCallback((): void => {
    if (sweepTimerRef.current) return;

    sweepTimerRef.current = setInterval(() => {
      const now = Date.now();
      let changed = false;

      Object.keys(speakingSinceRef.current).forEach((streamId) => {
        if (now - speakingSinceRef.current[streamId] > SPEAKING_HOLD_MS) {
          delete speakingSinceRef.current[streamId];
          changed = true;
        }
      });

      if (changed) commitTalkers();
      if (Object.keys(speakingSinceRef.current).length === 0) stopSweep();
    }, SPEAKING_SWEEP_MS);
  }, [commitTalkers, stopSweep]);

  const updateTalkerLevel = useCallback(
    (userId: string, level: number): void => {
      talkerAudioLevelsRef.current[userId] = level;

      if (level < SPEAKING_LEVEL) return;

      const wasSpeaking = userId in speakingSinceRef.current;
      speakingSinceRef.current[userId] = Date.now();

      if (!wasSpeaking) {
        commitTalkers();
        startSweep();
      }
    },
    [commitTalkers, startSweep],
  );

  const resetTalkers = useCallback((): void => {
    talkerAudioLevelsRef.current = {};
    speakingSinceRef.current = {};
    stopSweep();
    commitTalkers();
  }, [commitTalkers, stopSweep]);

  useEffect(() => stopSweep, [stopSweep]);

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

  const clearParticipant = useCallback(
    (streamId: string): void => {
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

      delete talkerAudioLevelsRef.current[streamId];

      if (streamId in speakingSinceRef.current) {
        delete speakingSinceRef.current[streamId];
        commitTalkers();
      }
    },
    [commitTalkers],
  );

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
    resetTalkers,
    clearParticipant,
    guestsWaitingApproval,
    setGuestsWaitingApproval,
    addFakeParticipant,
    removeFakeParticipant,
  };
};
