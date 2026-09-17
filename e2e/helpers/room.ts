// Unique per test-run room id so parallel/repeat CI runs never collide in
// the same Red5 Pro room.
export function makeRoomId(label: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${label}-${Date.now()}-${rand}`;
}
