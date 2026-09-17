import { describe, it } from 'vitest';
import { runMultiParticipantAudioScenario } from '../helpers/scenario.ts';

describe('1:1 meeting audio', () => {
  it('delivers audible audio between two participants', async () => {
    await runMultiParticipantAudioScenario(2);
  }, 120000);
});
