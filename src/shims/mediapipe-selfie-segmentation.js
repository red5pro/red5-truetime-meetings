// @mediapipe/selfie_segmentation only exposes SelfieSegmentation by mutating
// module.exports from inside a Closure-compiled helper, so bundlers that
// statically detect named/default exports (rolldown, esbuild) see no exports
// at all and fail the build. The package is actually meant to be consumed as
// a plain <script> that sets window.SelfieSegmentation, so we load it that
// way (as a static asset URL, never parsed as a JS module) and re-export the
// global once it's ready.
import scriptUrl from '@mediapipe/selfie_segmentation/selfie_segmentation.js?url';

function loadSelfieSegmentation() {
  if (typeof window === 'undefined') return Promise.resolve(undefined);
  if (window.SelfieSegmentation) return Promise.resolve(window.SelfieSegmentation);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = () => resolve(window.SelfieSegmentation);
    script.onerror = () => reject(new Error('Failed to load @mediapipe/selfie_segmentation'));
    document.head.appendChild(script);
  });
}

export const SelfieSegmentation = await loadSelfieSegmentation();
