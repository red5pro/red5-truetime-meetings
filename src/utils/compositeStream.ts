/**
 * Creates a single composite MediaStream from multiple input streams.
 *
 * Video tracks are rendered into a grid on an offscreen canvas.
 * Audio tracks from all streams are mixed via the Web Audio API.
 * Streams can be added or removed dynamically while the compositor is running.
 * Mute state is respected: disabled tracks are excluded from the grid and audio mix.
 *
 * When one or more streams are marked as screen shares, the layout switches to a
 * "presenter" mode: screen shares fill the left 75% of the canvas and camera feeds
 * are stacked in a sidebar on the right.
 */
export interface CompositeStreamHandle {
  stream: MediaStream;
  addStream: (stream: MediaStream, options?: { isScreenShare?: boolean }) => void;
  removeStream: (stream: MediaStream) => void;
  /** Override mute state for a specific stream (e.g. local user's cam/mic). */
  setStreamEnabled: (stream: MediaStream, videoEnabled: boolean, audioEnabled: boolean) => void;
  /** Mark or unmark a stream as a screen share, changing the canvas layout. */
  setStreamScreenShare: (stream: MediaStream, isScreenShare: boolean) => void;
  cleanup: () => void;
}

type Entry = {
  stream: MediaStream;
  videoElement: HTMLVideoElement | null;
  audioSource: MediaStreamAudioSourceNode | null;
  gainNode: GainNode | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isScreenShare: boolean;
};

export function createCompositeStream(
  streams: MediaStream[],
  width = 1280,
  height = 720,
  fps = 30,
  screenShareStreams?: Set<MediaStream>,
): CompositeStreamHandle {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  // AudioContexts created without a direct user-gesture call stack (e.g. when local
  // recording is auto-started via a room state event) can start in "suspended" state.
  // While suspended, the destination's audio track produces no data, resulting in a
  // recording with no sound even though the video track works fine.
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const entries: Entry[] = [];

  const addEntry = (
    stream: MediaStream,
    videoEnabled = true,
    audioEnabled = true,
    isScreenShare = false,
  ) => {
    let videoElement: HTMLVideoElement | null = null;
    let audioSource: MediaStreamAudioSourceNode | null = null;
    let gainNode: GainNode | null = null;

    if (stream.getVideoTracks().length > 0) {
      videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.play().catch(() => {});
    }

    if (stream.getAudioTracks().length > 0) {
      audioSource = audioContext.createMediaStreamSource(stream);
      gainNode = audioContext.createGain();
      gainNode.gain.value = audioEnabled ? 1 : 0;
      audioSource.connect(gainNode);
      gainNode.connect(destination);
    }

    entries.push({
      stream,
      videoElement,
      audioSource,
      gainNode,
      videoEnabled,
      audioEnabled,
      isScreenShare,
    });
  };

  streams.forEach((s) => addEntry(s, true, true, screenShareStreams?.has(s) ?? false));

  const drawTile = (
    video: HTMLVideoElement,
    cellX: number,
    cellY: number,
    cellW: number,
    cellH: number,
  ) => {
    const srcW = video.videoWidth || cellW;
    const srcH = video.videoHeight || cellH;
    const scale = Math.min(cellW / srcW, cellH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const dx = cellX + (cellW - drawW) / 2;
    const dy = cellY + (cellH - drawH) / 2;
    ctx.drawImage(video, dx, dy, drawW, drawH);
  };

  // Continuously draw all video frames to the canvas.
  // When screen shares are present, they take the left 75% of the canvas and camera
  // feeds are stacked in a sidebar on the right. Otherwise a square grid is used.
  let animFrameId: number;
  const draw = () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const activeEntries = entries.filter((e) => {
      if (!e.videoElement || !e.videoEnabled) return false;
      const track = e.stream.getVideoTracks()[0];
      return !track || (track.enabled && track.readyState !== 'ended');
    });

    const count = activeEntries.length;
    if (count > 0) {
      const screenShareEntries = activeEntries.filter((e) => e.isScreenShare);
      const cameraEntries = activeEntries.filter((e) => !e.isScreenShare);

      if (screenShareEntries.length > 0) {
        // Presenter layout: screen shares on the left, cameras in a right sidebar
        const mainW = cameraEntries.length > 0 ? Math.round(width * 0.75) : width;
        const sideW = width - mainW;

        const ssCount = screenShareEntries.length;
        const ssCols = Math.ceil(Math.sqrt(ssCount));
        const ssRows = Math.ceil(ssCount / ssCols);
        const ssCellW = mainW / ssCols;
        const ssCellH = height / ssRows;

        screenShareEntries.forEach(({ videoElement }, i) => {
          const col = i % ssCols;
          const row = Math.floor(i / ssCols);
          drawTile(videoElement!, col * ssCellW, row * ssCellH, ssCellW, ssCellH);
        });

        if (cameraEntries.length > 0) {
          const camCellH = height / cameraEntries.length;
          cameraEntries.forEach(({ videoElement }, i) => {
            drawTile(videoElement!, mainW, i * camCellH, sideW, camCellH);
          });
        }
      } else {
        // Default grid layout
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const cellW = width / cols;
        const cellH = height / rows;

        activeEntries.forEach(({ videoElement }, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          drawTile(videoElement!, col * cellW, row * cellH, cellW, cellH);
        });
      }
    }

    animFrameId = requestAnimationFrame(draw);
  };
  draw();

  const canvasStream = canvas.captureStream(fps);
  const compositeStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ]);

  const addStream = (stream: MediaStream, options?: { isScreenShare?: boolean }) => {
    if (entries.some((e) => e.stream === stream)) return;
    addEntry(stream, true, true, options?.isScreenShare ?? false);
  };

  const removeStream = (stream: MediaStream) => {
    const idx = entries.findIndex((e) => e.stream === stream);
    if (idx === -1) return;
    const { videoElement, audioSource, gainNode } = entries[idx];
    if (videoElement) videoElement.srcObject = null;
    if (gainNode) gainNode.disconnect();
    if (audioSource) audioSource.disconnect();
    entries.splice(idx, 1);
  };

  const setStreamEnabled = (stream: MediaStream, videoEnabled: boolean, audioEnabled: boolean) => {
    const entry = entries.find((e) => e.stream === stream);
    if (!entry) return;
    entry.videoEnabled = videoEnabled;
    entry.audioEnabled = audioEnabled;
    if (entry.gainNode) {
      entry.gainNode.gain.value = audioEnabled ? 1 : 0;
    }
  };

  const setStreamScreenShare = (stream: MediaStream, isScreenShare: boolean) => {
    const entry = entries.find((e) => e.stream === stream);
    if (!entry) return;
    entry.isScreenShare = isScreenShare;
  };

  const cleanup = () => {
    cancelAnimationFrame(animFrameId);
    audioContext.close().catch(() => {});
    entries.forEach(({ videoElement }) => {
      if (videoElement) videoElement.srcObject = null;
    });
    entries.length = 0;
  };

  return {
    stream: compositeStream,
    addStream,
    removeStream,
    setStreamEnabled,
    setStreamScreenShare,
    cleanup,
  };
}
