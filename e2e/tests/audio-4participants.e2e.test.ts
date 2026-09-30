import { describe, it } from 'vitest';
import { runMultiParticipantAudioScenario } from '../helpers/scenario.ts';

describe('4-participant meeting audio', () => {
  it('delivers audible audio between all four participants', async () => {
    await runMultiParticipantAudioScenario(4);
  }, 180000);
});
