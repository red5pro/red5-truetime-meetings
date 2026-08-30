import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TONE_DURATION_SECONDS, TONE_FREQUENCY_HZ } from '../helpers/config.ts';

// Chrome's --use-file-for-fake-audio-capture only accepts mono 16-bit PCM WAV.
const SAMPLE_RATE = 48000;

function encodeWav(samples: Int16Array, sampleRate: number): Buffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * bytesPerSample);
  }

  return buffer;
}

function generateToneSamples(
  durationSeconds: number,
  sampleRate: number,
  freqHz: number,
): Int16Array {
  const total = Math.floor(durationSeconds * sampleRate);
  const samples = new Int16Array(total);
  const amplitude = 0.6 * 32767;
  // Fade the first/last ~10ms in and out so the loop point Chrome makes when
  // it repeats the file doesn't inject an audible click into every sample window.
  const fadeSamples = Math.floor(sampleRate * 0.01);

  for (let i = 0; i < total; i++) {
    const fade = Math.min(i, total - 1 - i, fadeSamples) / fadeSamples;
    samples[i] = Math.round(
      amplitude * Math.min(1, fade) * Math.sin((2 * Math.PI * freqHz * i) / sampleRate),
    );
  }

  return samples;
}

let cachedPath: Promise<string> | null = null;

// Generates (once, cached) a short sine-tone WAV used as every participant's
// fake microphone input, so remote tracks have real, measurable energy in
// them instead of the fake device's default silence.
export function toneFilePath(): Promise<string> {
  if (!cachedPath) {
    cachedPath = (async () => {
      const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.tmp');
      await mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `tone-${TONE_FREQUENCY_HZ}hz.wav`);
      const samples = generateToneSamples(TONE_DURATION_SECONDS, SAMPLE_RATE, TONE_FREQUENCY_HZ);
      await writeFile(filePath, encodeWav(samples, SAMPLE_RATE));
      return filePath;
    })();
  }
  return cachedPath;
}
