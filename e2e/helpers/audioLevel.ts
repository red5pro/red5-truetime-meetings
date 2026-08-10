import { WebDriver } from 'selenium-webdriver';
import { AUDIO_SAMPLE_MS } from './config.ts';
import { REMOTE_MEDIA_SELECTOR } from './meeting.ts';

// Runs inside the browser via executeAsyncScript. Attaches a Web Audio
// AnalyserNode to every remote participant's media element and reports the
// peak RMS level seen over the sampling window, keyed by element id
// ("red5pro-subscriber-<streamId>"). This checks the actual decoded audio
// energy on the wire — independent of the app's own talker-detection UI —
// so it also catches cases where audio arrives but is silent/corrupted.
function sampleRemoteAudioLevels(
  selector: string,
  sampleMs: number,
  callback: (result: Record<string, number>) => void,
): void {
  const elements = Array.from(document.querySelectorAll(selector)) as (
    | HTMLVideoElement
    | HTMLAudioElement
  )[];

  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextCtor();
  const results: Record<string, number> = {};
  const analysers: { id: string; analyser: AnalyserNode; data: Uint8Array }[] = [];

  for (const element of elements) {
    const stream = element.srcObject as MediaStream | null;
    if (!stream || stream.getAudioTracks().length === 0) continue;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    analysers.push({ id: element.id, analyser, data: new Uint8Array(analyser.fftSize) });
    results[element.id] = 0;
  }

  if (analysers.length === 0) {
    audioContext.close();
    callback(results);
    return;
  }

  const start = performance.now();

  function sample(): void {
    for (const { id, analyser, data } of analysers) {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      results[id] = Math.max(results[id], rms);
    }

    if (performance.now() - start < sampleMs) {
      requestAnimationFrame(sample);
    } else {
      audioContext.close();
      callback(results);
    }
  }

  requestAnimationFrame(sample);
}

// Returns { [remoteElementId]: peakRms } for every remote participant tile
// currently rendered in `driver`'s browser.
export async function measureRemoteAudioLevels(
  driver: WebDriver,
  sampleMs: number = AUDIO_SAMPLE_MS,
): Promise<Record<string, number>> {
  return driver.executeAsyncScript(sampleRemoteAudioLevels, REMOTE_MEDIA_SELECTOR, sampleMs);
}
