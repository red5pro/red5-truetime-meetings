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
 *
 * Input streams are re-checked on every tick so track swaps are followed. The SDK
 * replaces the local mic/camera by removing and stopping the old track and adding a
 * new one to the same MediaStream (device change, "default" device re-selection).
 * A MediaStreamAudioSourceNode stays bound to the track it was created with, so
 * without this the swapped participant goes silent for the rest of the recording.
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
  videoTrack: MediaStreamTrack | null;
  // One source node per live audio track, all feeding the entry's gain node
  audioSources: Map<MediaStreamTrack, MediaStreamAudioSourceNode>;
  gainNode: GainNode;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isScreenShare: boolean;
};

// Re-sync input tracks this often (in draw ticks) to pick up track swaps
const TRACK_SYNC_INTERVAL_TICKS = 15;

// requestAnimationFrame stops in hidden or fully covered tabs, which freezes the
// recorded video. Timers in a dedicated worker keep running in the background.
const TICKER_WORKER_SOURCE = `
let id;
onmessage = (e) => {
  clearInterval(id);
  if (e.data > 0) id = setInterval(() => postMessage(0), e.data);
};
`;

function startTicker(fps: number, tick: () => void): () => void {
  if (typeof Worker === 'undefined' || typeof URL.createObjectURL !== 'function') {
    let frameId = requestAnimationFrame(function loop() {
      tick();
      frameId = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frameId);
  }
  const url = URL.createObjectURL(
    new Blob([TICKER_WORKER_SOURCE], { type: 'application/javascript' }),
  );
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  worker.onmessage = tick;
  worker.postMessage(1000 / fps);
  return () => worker.terminate();
}

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

  // Without an explicit rate the mix runs at the output device's rate, which can be
  // 16/24 kHz on a Bluetooth headset and would cap the recording at that quality.
  const audioContext = new AudioContext({ sampleRate: 48000 });
  const destination = audioContext.createMediaStreamDestination();

  // AudioContexts created without a direct user-gesture call stack (e.g. when local
  // recording is auto-started via a room state event) can start in "suspended" state.
  // While suspended, the destination's audio track produces no data, resulting in a
  // recording with no sound even though the video track works fine.
  // Browsers that require a gesture in the same call stack (Safari) keep rejecting
  // resume() until the next click or key press, so retry on the next one.
  const resumeOnGesture = () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  };
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
    document.addEventListener('pointerdown', resumeOnGesture, true);
    document.addEventListener('keydown', resumeOnGesture, true);
  }

  const entries: Entry[] = [];

  const syncTracks = (entry: Entry) => {
    const liveAudio: MediaStreamTrack[] = entry.stream
      .getAudioTracks()
      .filter((t) => t.readyState !== 'ended');
    entry.audioSources.forEach((source, track) => {
      if (!liveAudio.includes(track)) {
        source.disconnect();
        entry.audioSources.delete(track);
      }
    });
    liveAudio.forEach((track) => {
      if (entry.audioSources.has(track)) return;
      const source = audioContext.createMediaStreamSource(new MediaStream([track]));
      source.connect(entry.gainNode);
      entry.audioSources.set(track, source);
    });

    const videoTrack = entry.stream.getVideoTracks()[0] ?? null;
    if (videoTrack === entry.videoTrack) return;
    entry.videoTrack = videoTrack;
    if (!videoTrack) return;
    if (!entry.videoElement) {
      entry.videoElement = document.createElement('video');
      entry.videoElement.muted = true;
      entry.videoElement.autoplay = true;
      entry.videoElement.playsInline = true;
    }
    // Reassign so the element picks up a track that was swapped into the same stream
    entry.videoElement.srcObject = entry.stream;
    entry.videoElement.play().catch(() => {});
  };

  const addEntry = (
    stream: MediaStream,
    videoEnabled = true,
    audioEnabled = true,
    isScreenShare = false,
  ) => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = audioEnabled ? 1 : 0;
    gainNode.connect(destination);

    const entry: Entry = {
      stream,
      videoElement: null,
      videoTrack: null,
      audioSources: new Map(),
      gainNode,
      videoEnabled,
      audioEnabled,
      isScreenShare,
    };
    syncTracks(entry);
    entries.push(entry);
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
  let ticks = 0;
  const draw = () => {
    if (++ticks % TRACK_SYNC_INTERVAL_TICKS === 0) {
      entries.forEach(syncTracks);
    }

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
  };
  draw();
  const stopTicker = startTicker(fps, draw);

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
    const { videoElement, audioSources, gainNode } = entries[idx];
    if (videoElement) videoElement.srcObject = null;
    gainNode.disconnect();
    audioSources.forEach((source) => source.disconnect());
    entries.splice(idx, 1);
  };

  const setStreamEnabled = (stream: MediaStream, videoEnabled: boolean, audioEnabled: boolean) => {
    const entry = entries.find((e) => e.stream === stream);
    if (!entry) return;
    entry.videoEnabled = videoEnabled;
    entry.audioEnabled = audioEnabled;
    entry.gainNode.gain.value = audioEnabled ? 1 : 0;
  };

  const setStreamScreenShare = (stream: MediaStream, isScreenShare: boolean) => {
    const entry = entries.find((e) => e.stream === stream);
    if (!entry) return;
    entry.isScreenShare = isScreenShare;
  };

  const cleanup = () => {
    stopTicker();
    document.removeEventListener('pointerdown', resumeOnGesture, true);
    document.removeEventListener('keydown', resumeOnGesture, true);
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
