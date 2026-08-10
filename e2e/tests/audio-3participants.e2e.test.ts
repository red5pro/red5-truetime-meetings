import { describe, it } from 'vitest';
import { runMultiParticipantAudioScenario } from '../helpers/scenario.ts';

describe('3-participant meeting audio', () => {
  it('delivers audible audio between all three participants', async () => {
    await runMultiParticipantAudioScenario(3);
  }, 150000);
});
