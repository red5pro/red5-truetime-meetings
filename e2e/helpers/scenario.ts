import { expect } from 'vitest';
import { WebDriver } from 'selenium-webdriver';
import { createParticipantDriver, quitAll } from './driver.ts';
import { joinMeeting, waitForRemoteParticipants } from './meeting.ts';
import { measureRemoteAudioLevels } from './audioLevel.ts';
import { toneFilePath } from '../fixtures/generateTone.ts';
import { makeRoomId } from './room.ts';
import { AUDIO_RMS_THRESHOLD } from './config.ts';

// Joins `participantCount` fake participants (each "speaking" a 440Hz tone
// via their fake microphone) into one fresh room, then asserts that every
// participant both sees N-1 remote tracks and can actually hear real audio
// energy on each of them. This is the shared body behind the 2/3/4-person
// suites — only the headcount differs between them.
export async function runMultiParticipantAudioScenario(participantCount: number): Promise<void> {
  const roomId = makeRoomId(`e2e-${participantCount}p`);
  const tone = await toneFilePath();

  const drivers: WebDriver[] = await Promise.all(
    Array.from({ length: participantCount }, () => createParticipantDriver(tone)),
  );

  try {
    // Sequential on purpose: joining every participant at once races the
    // room/signaling layer (observed as remote tracks never going "live"),
    // where joining one-by-one — closer to how real users actually join —
    // reliably reaches a live audio track within ~10s per participant.
    for (const [index, driver] of drivers.entries()) {
      await joinMeeting(driver, roomId, `Participant${index + 1}`);
    }

    const expectedRemoteCount = participantCount - 1;
    await Promise.all(
      drivers.map((driver) => waitForRemoteParticipants(driver, expectedRemoteCount)),
    );

    const levelsPerParticipant = await Promise.all(
      drivers.map((driver) => measureRemoteAudioLevels(driver)),
    );

    levelsPerParticipant.forEach((levels, index) => {
      const participantLabel = `Participant${index + 1}`;

      expect(
        Object.keys(levels).length,
        `${participantLabel} should have ${expectedRemoteCount} remote audio track(s), saw ${Object.keys(levels).length}`,
      ).toBe(expectedRemoteCount);

      for (const [remoteId, rms] of Object.entries(levels)) {
        expect(
          rms,
          `${participantLabel} should hear audible audio from ${remoteId} (measured RMS ${rms.toFixed(4)}, threshold ${AUDIO_RMS_THRESHOLD})`,
        ).toBeGreaterThan(AUDIO_RMS_THRESHOLD);
      }
    });
  } finally {
    await quitAll(drivers);
  }
}
