/**
 * Creates a single composite MediaStream from multiple input streams.
 *
 * Video tracks are rendered into a grid on an offscreen canvas.
 * Audio tracks from all streams are mixed via the Web Audio API.
 * Streams can be added or removed dynamically while the compositor is running.
 */
export interface CompositeStreamHandle {
  stream: MediaStream;
  addStream: (stream: MediaStream) => void;
  removeStream: (stream: MediaStream) => void;
  cleanup: () => void;
}

type Entry = {
  stream: MediaStream;
  videoElement: HTMLVideoElement | null;
  audioSource: AudioNode | null;
};

export function createCompositeStream(
  streams: MediaStream[],
  width = 1280,
  height = 720,
  fps = 30,
): CompositeStreamHandle {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  const entries: Entry[] = [];

  const addEntry = (stream: MediaStream) => {
    let videoElement: HTMLVideoElement | null = null;
    let audioSource: AudioNode | null = null;

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
      audioSource.connect(destination);
    }

    entries.push({ stream, videoElement, audioSource });
  };

  streams.forEach(addEntry);

  // Continuously draw all video frames to the canvas in a grid layout
  let animFrameId: number;
  const draw = () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const videoEntries = entries.filter((e) => e.videoElement !== null);
    const count = videoEntries.length;
    if (count > 0) {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = width / cols;
      const cellH = height / rows;
      videoEntries.forEach(({ videoElement }, i) => {
        const video = videoElement!;
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Preserve original aspect ratio — letterbox inside the cell
        const srcW = video.videoWidth || cellW;
        const srcH = video.videoHeight || cellH;
        const scale = Math.min(cellW / srcW, cellH / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const dx = col * cellW + (cellW - drawW) / 2;
        const dy = row * cellH + (cellH - drawH) / 2;

        ctx.drawImage(video, dx, dy, drawW, drawH);
      });
    }

    animFrameId = requestAnimationFrame(draw);
  };
  draw();

  const canvasStream = canvas.captureStream(fps);
  const compositeStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ]);

  const addStream = (stream: MediaStream) => {
    if (entries.some((e) => e.stream === stream)) return;
    addEntry(stream);
  };

  const removeStream = (stream: MediaStream) => {
    const idx = entries.findIndex((e) => e.stream === stream);
    if (idx === -1) return;
    const { videoElement, audioSource } = entries[idx];
    if (videoElement) videoElement.srcObject = null;
    if (audioSource) (audioSource as AudioNode & { disconnect: () => void }).disconnect();
    entries.splice(idx, 1);
  };

  const cleanup = () => {
    cancelAnimationFrame(animFrameId);
    audioContext.close().catch(() => {});
    entries.forEach(({ videoElement }) => {
      if (videoElement) videoElement.srcObject = null;
    });
    entries.length = 0;
  };

  return { stream: compositeStream, addStream, removeStream, cleanup };
}
