// Central place for the env vars the e2e audio suite depends on.
// APP_URL must point at a running build of this app (e.g. `npm run preview`)
// that is itself configured (via .env / config.json) to talk to a real,
// reachable Red5 Pro deployment — Selenium can't fake the media server side.

export const APP_URL = (process.env.E2E_APP_URL ?? 'http://localhost:4173').replace(/\/$/, '');

export const HEADLESS = process.env.E2E_HEADLESS !== 'false';

// Must match the built app's router basename (src/main.tsx falls back to
// "/meetings" whenever VITE_BASENAME resolves empty/falsy at runtime — which
// is what you get by default, so that's the default here too). Override
// with E2E_APP_BASENAME if your build actually serves from root ("/") or
// another path. "/" and "" both mean "no prefix".
export const APP_BASENAME = normalizeBasename(process.env.E2E_APP_BASENAME ?? '/meetings');

function normalizeBasename(basename: string): string {
  const trimmed = basename.trim();
  if (trimmed === '' || trimmed === '/') return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/$/, '');
}

// Chrome's fake-audio-capture WAV is looped for the lifetime of the capture,
// so this only needs to be long enough to avoid restart clicks/pops landing
// inside a short measurement window.
export const TONE_DURATION_SECONDS = 10;
export const TONE_FREQUENCY_HZ = 440;

// Root-mean-square amplitude (0-1) above which a sampled remote track counts
// as "audible". Fake-device silence measures ~0; the injected 440Hz tone
// measures ~0.6-0.7 locally, but by the time it's round-tripped through the
// SFU's audio pipeline (echo cancellation/AGC/opus) it's been observed as
// low as ~0.05 on the receiving end — still >40x above silence.
export const AUDIO_RMS_THRESHOLD = 0.02;

export const AUDIO_SAMPLE_MS = 4000;
