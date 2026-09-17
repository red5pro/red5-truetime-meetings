import { Builder, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { HEADLESS } from './config.ts';

// One Chrome instance stands in for one meeting participant. Fake device
// flags skip the OS media stack entirely: the mic "records" whatever WAV
// file is pointed at, the camera synthesizes a test pattern, and the
// permission prompt is auto-accepted instead of hanging the run.
export async function createParticipantDriver(audioFilePath: string): Promise<WebDriver> {
  const options = new chrome.Options();

  options.addArguments(
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    `--use-file-for-fake-audio-capture=${audioFilePath}`,
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1280,800',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  );

  if (HEADLESS) {
    options.addArguments('--headless=new');
  }

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  // executeAsyncScript (used for audio-level sampling) needs headroom beyond
  // the sampling window itself for context setup/teardown.
  await driver.manage().setTimeouts({ script: 20000, pageLoad: 30000 });
  return driver;
}

export async function quitAll(drivers: WebDriver[]): Promise<void> {
  await Promise.all(
    drivers.map((driver) =>
      driver.quit().catch((error: unknown) => {
        // A driver that already crashed shouldn't hide failures from the
        // other, working drivers being torn down alongside it.
        console.warn('Failed to quit a WebDriver session cleanly:', error);
      }),
    ),
  );
}
