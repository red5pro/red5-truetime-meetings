import { By, until, WebDriver } from 'selenium-webdriver';
import { APP_URL, APP_BASENAME } from './config.ts';

// Every remote participant's media renders into a <video> or <audio> tag
// with this id prefix (src/pages/Layout/*.tsx, src/Components/Cards/VideoCard.tsx).
export const REMOTE_MEDIA_SELECTOR =
  'video[id^="red5pro-subscriber-"], audio[id^="red5pro-subscriber-"]';

// Drives one participant from the room URL through the lobby into the
// meeting. Mirrors the manual flow: type a name, grant device permissions if
// the app is still waiting on them, then hit Join.
export async function joinMeeting(
  driver: WebDriver,
  roomId: string,
  displayName: string,
): Promise<void> {
  await driver.get(`${APP_URL}${APP_BASENAME}/${roomId}`);

  const nameInput = await driver.wait(until.elementLocated(By.id('participant_name')), 20000);
  await driver.wait(until.elementIsVisible(nameInput), 10000);
  await nameInput.clear();
  await nameInput.sendKeys(displayName);

  // --use-fake-ui-for-media-stream auto-accepts the getUserMedia prompt, but
  // the app still gates Join on the Permissions API reporting "granted",
  // which only happens after a getUserMedia call actually fires. If the app
  // is showing its own explicit permission dialog first, click through it.
  // The dialog can also dismiss itself right as permissions land (fake-ui
  // grants them near-instantly), racing us between find and click — a stale
  // element there just means it already got out of our way.
  const permissionButtons = await driver.findElements(By.id('give_device_permission_button'));
  if (permissionButtons.length > 0) {
    try {
      await permissionButtons[0].click();
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'StaleElementReferenceError') {
        throw error;
      }
    }
  }

  const joinButton = await driver.wait(until.elementLocated(By.id('room_join_button')), 20000);
  await driver.wait(
    async () => (await joinButton.getAttribute('disabled')) === null,
    20000,
    'Join button never became enabled — device permissions likely were not granted',
  );
  await joinButton.click();

  // The local self-view tile only mounts once the user is actually in the room.
  await driver.wait(until.elementLocated(By.id('red5pro-publisher')), 30000);
}

function countRemoteTracksWithAudio(selector: string): number {
  const elements = Array.from(document.querySelectorAll(selector)) as (
    | HTMLVideoElement
    | HTMLAudioElement
  )[];
  return elements.filter((element) => {
    const stream = element.srcObject as MediaStream | null;
    return !!stream && stream.getAudioTracks().some((track) => track.readyState === 'live');
  }).length;
}

// Waits for remote tiles to both mount in the DOM *and* have their WebRTC
// audio track actually attached — the <video>/<audio> element renders before
// the SDK sets srcObject, so checking DOM presence alone races the track.
export async function waitForRemoteParticipants(
  driver: WebDriver,
  expectedCount: number,
  timeoutMs = 45000,
): Promise<void> {
  await driver.wait(
    async () => {
      const count = await driver.executeScript(countRemoteTracksWithAudio, REMOTE_MEDIA_SELECTOR);
      return (count as number) >= expectedCount;
    },
    timeoutMs,
    `Timed out waiting for ${expectedCount} remote participant(s) with a live audio track`,
  );
}
