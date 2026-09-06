import { useMemo, useState } from 'react';

import { ParticipantObject } from '../pages/Layout/types.ts';
import { isScreenShareParticipant, screenShareOwnerId } from '../utils/utils.tsx';

const NO_TALKERS: string[] = [];
const DEFAULT_SLOT_COUNT = 3;

interface UseSpeakerOrderOptions {
  allParticipants: ParticipantObject[];
  pinnedParticipantId?: string | null;
  talkers?: string[];
  slotCount?: number;
}

interface SpeakerState {
  talkers: string[];
  // Counter instead of a clock: only the relative order of turns matters.
  turn: number;
  lastTurn: Record<string, number>;
  // Sidebar positions. A uid keeps its index until it leaves or is replaced.
  slots: (string | null)[];
}

interface SlotInput {
  candidates: string[];
  talkers: string[];
  presenterId?: string;
  slotCount: number;
}

const INITIAL_STATE: SpeakerState = { talkers: NO_TALKERS, turn: 0, lastTurn: {}, slots: [] };

/**
 * Seats participants into fixed sidebar slots. A tile that is already on the right
 * stays where it is; it only moves out when it leaves or when someone who is talking
 * needs a slot, which keeps fluctuating audio levels from reshuffling the column.
 */
const nextSpeakerState = (prev: SpeakerState, input: SlotInput): SpeakerState => {
  const { candidates, talkers, presenterId, slotCount } = input;

  // Stamp a new turn for whoever is talking now.
  const talkersChanged = prev.talkers !== talkers;
  const turn = talkersChanged ? prev.turn + 1 : prev.turn;
  let lastTurn = prev.lastTurn;
  if (talkersChanged && talkers.length > 0) {
    lastTurn = { ...prev.lastTurn };
    talkers.forEach((uid) => {
      lastTurn[uid] = turn;
    });
  }

  // Keep every occupant in place, empty the slots of people who are gone.
  const present = new Set(candidates);
  const slots: (string | null)[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    const uid = prev.slots[i] ?? null;
    slots[i] = uid && present.has(uid) ? uid : null;
  }

  // The presenter owns the first slot.
  if (presenterId && present.has(presenterId) && slots[0] !== presenterId) {
    const heldIndex = slots.indexOf(presenterId);
    const bumped = slots[0];
    slots[0] = presenterId;
    if (heldIndex > 0) {
      slots[heldIndex] = bumped;
    } else {
      const free = slots.indexOf(null, 1);
      if (free !== -1) slots[free] = bumped;
    }
  }

  const talking = new Set(talkers);
  const rankOf = (uid: string): number => lastTurn[uid] ?? 0;

  // Fill empty slots with whoever is talking, then the most recent speakers.
  const seated = new Set(slots.filter(Boolean) as string[]);
  const waiting = candidates
    .filter((uid) => !seated.has(uid))
    .sort((a, b) => Number(talking.has(b)) - Number(talking.has(a)) || rankOf(b) - rankOf(a));

  slots.forEach((uid, index) => {
    if (uid === null && waiting.length > 0) {
      slots[index] = waiting.shift()!;
    }
  });

  // Nobody left to seat: a new speaker takes over the quietest silent slot, in place.
  waiting
    .filter((uid) => talking.has(uid))
    .forEach((speaker) => {
      let victim = -1;
      slots.forEach((uid, index) => {
        if (!uid || uid === presenterId || talking.has(uid)) return;
        if (victim === -1 || rankOf(uid) < rankOf(slots[victim]!)) victim = index;
      });
      if (victim !== -1) slots[victim] = speaker;
    });

  const sameSlots =
    slots.length === prev.slots.length && slots.every((uid, index) => uid === prev.slots[index]);
  if (!talkersChanged && sameSlots) return prev;

  return { talkers, turn, lastTurn, slots };
};

/**
 * Orders participants so the sidebar always shows who matters: the presenter first,
 * then whoever is talking, then the most recent speakers. Without this a speaker can
 * sit outside the few visible slots and appear to talk from nowhere.
 */
export const useSpeakerOrder = ({
  allParticipants,
  pinnedParticipantId,
  talkers = NO_TALKERS,
  slotCount = DEFAULT_SLOT_COUNT,
}: UseSpeakerOrderOptions): { orderedParticipants: ParticipantObject[] } => {
  const [speech, setSpeech] = useState<SpeakerState>(INITIAL_STATE);

  // The presenter is the owner of the screen share currently pinned as the main view.
  const presenterId = useMemo(() => {
    const pinned = allParticipants.find((p) => p.participant.uid === pinnedParticipantId);
    return isScreenShareParticipant(pinned?.participant)
      ? screenShareOwnerId(pinned?.participant)
      : undefined;
  }, [allParticipants, pinnedParticipantId]);

  // Everyone the sidebar could show, in join order.
  const candidates = useMemo(
    () =>
      allParticipants
        .filter((p) => p.participant.uid !== pinnedParticipantId)
        .map((p) => p.participant.uid),
    [allParticipants, pinnedParticipantId],
  );

  // Reseat during render; the same state comes back when nothing moved.
  const state = nextSpeakerState(speech, { candidates, talkers, presenterId, slotCount });
  if (state !== speech) setSpeech(state);

  const orderedParticipants = useMemo(() => {
    const slotOf = new Map<string, number>();
    state.slots.forEach((uid, index) => {
      if (uid) slotOf.set(uid, index);
    });
    if (slotOf.size === 0) return allParticipants;

    const seated: ParticipantObject[] = [];
    const rest: ParticipantObject[] = [];
    allParticipants.forEach((p) => {
      (slotOf.has(p.participant.uid) ? seated : rest).push(p);
    });
    seated.sort((a, b) => slotOf.get(a.participant.uid)! - slotOf.get(b.participant.uid)!);

    return [...seated, ...rest];
  }, [allParticipants, state.slots]);

  return { orderedParticipants };
};
