import { useMemo, useState } from 'react';

import { ParticipantObject } from '../pages/Layout/types.ts';
import { isScreenShareParticipant, screenShareOwnerId } from '../utils/utils.tsx';

// Anyone speaking right now outranks anyone who only spoke earlier.
const ACTIVE_SPEAKER_BOOST = Number.MAX_SAFE_INTEGER / 2;
const NO_TALKERS: string[] = [];

interface UseSpeakerOrderOptions {
  allParticipants: ParticipantObject[];
  pinnedParticipantId?: string | null;
  talkers?: string[];
}

interface SpeechHistory {
  talkers: string[];
  // Counter instead of a clock: only the relative order of turns matters.
  turn: number;
  lastTurn: Record<string, number>;
}

const INITIAL_HISTORY: SpeechHistory = { talkers: NO_TALKERS, turn: 0, lastTurn: {} };

/**
 * Orders participants so the sidebar always shows who matters: the presenter first,
 * then whoever is talking, then the most recent speakers. Without this a speaker can
 * sit outside the few visible slots and appear to talk from nowhere.
 */
export const useSpeakerOrder = ({
  allParticipants,
  pinnedParticipantId,
  talkers = NO_TALKERS,
}: UseSpeakerOrderOptions): { orderedParticipants: ParticipantObject[] } => {
  const [speech, setSpeech] = useState<SpeechHistory>(INITIAL_HISTORY);

  // Stamp speakers during render. `talkers` keeps its identity until the set of
  // talkers actually changes, so this settles in one extra render.
  if (speech.talkers !== talkers) {
    const turn = speech.turn + 1;
    const lastTurn = { ...speech.lastTurn };
    talkers.forEach((streamId) => {
      lastTurn[streamId] = turn;
    });
    setSpeech({ talkers, turn, lastTurn });
  }

  // The presenter is the owner of the screen share currently pinned as the main view.
  const presenterId = useMemo(() => {
    const pinned = allParticipants.find((p) => p.participant.uid === pinnedParticipantId);
    return isScreenShareParticipant(pinned?.participant)
      ? screenShareOwnerId(pinned?.participant)
      : undefined;
  }, [allParticipants, pinnedParticipantId]);

  const orderedParticipants = useMemo(() => {
    const talking = new Set(talkers);

    const rankOf = (uid: string): number => {
      if (presenterId && uid === presenterId) return Number.MAX_SAFE_INTEGER;

      const turn = speech.lastTurn[uid] ?? 0;
      return talking.has(uid) ? turn + ACTIVE_SPEAKER_BOOST : turn;
    };

    // Array.sort is stable, so participants of equal rank keep their incoming order.
    return [...allParticipants].sort(
      (a, b) => rankOf(b.participant.uid) - rankOf(a.participant.uid),
    );
  }, [allParticipants, talkers, speech.lastTurn, presenterId]);

  return { orderedParticipants };
};
