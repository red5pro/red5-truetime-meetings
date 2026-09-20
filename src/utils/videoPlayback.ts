import log from 'loglevel';

const pendingRetries = new WeakSet<HTMLMediaElement>();

function retryOnNextGesture(element: HTMLMediaElement): void {
  if (pendingRetries.has(element)) return;
  pendingRetries.add(element);

  const retry = (): void => {
    pendingRetries.delete(element);
    element.play().catch((error: unknown) => {
      log.warn(`Retried play() still failed for ${element.id || 'media element'}:`, error);
    });
  };

  document.addEventListener('pointerdown', retry, { once: true, passive: true });
}

// Mobile browsers (iOS Safari in particular) block autoplay for unmuted
// video/audio outside a user-gesture window. Remote participant tiles render
// unmuted, so a track that attaches mid-call (a participant joining after
// yours, a reconnect, a layout switch) can silently fail to ever start
// playing — that participant's audio then stays dead for the rest of the
// call with no visible error. Retrying on the viewer's next tap recovers it.
export function attachStreamAndPlay(
  element: HTMLMediaElement | null,
  mediaStream: MediaStream | null,
): void {
  if (!element || !mediaStream || element.srcObject === mediaStream) return;

  element.srcObject = mediaStream;
  element.play().catch((error: unknown) => {
    log.warn(`play() failed for ${element.id || 'media element'}:`, error);
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      retryOnNextGesture(element);
    }
  });
}
