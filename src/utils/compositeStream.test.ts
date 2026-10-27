import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCompositeStream } from './compositeStream';

class FakeTrack {
  readyState: 'live' | 'ended' = 'live';
  enabled = true;
  constructor(public kind: 'audio' | 'video') {}
  stop() {
    this.readyState = 'ended';
  }
}

class FakeMediaStream {
  private tracks: FakeTrack[];
  constructor(tracks: FakeTrack[] = []) {
    this.tracks = [...tracks];
  }
  getTracks() {
    return [...this.tracks];
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio');
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video');
  }
  addTrack(track: FakeTrack) {
    this.tracks.push(track);
  }
  removeTrack(track: FakeTrack) {
    this.tracks = this.tracks.filter((t) => t !== track);
  }
}

const node = () => ({ connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1 } });
let sources: { track: FakeTrack; node: ReturnType<typeof node> }[];

class FakeAudioContext {
  state = 'running';
  createMediaStreamDestination() {
    return { stream: new FakeMediaStream([new FakeTrack('audio')]) };
  }
  createGain() {
    return node();
  }
  createMediaStreamSource(stream: FakeMediaStream) {
    const n = node();
    sources.push({ track: stream.getAudioTracks()[0], node: n });
    return n;
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

describe('createCompositeStream', () => {
  let tick: () => void;

  beforeEach(() => {
    sources = [];
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('Worker', undefined);
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
      tick = cb;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    })) as never;
    HTMLCanvasElement.prototype.captureStream = (() =>
      new FakeMediaStream([new FakeTrack('video')])) as never;
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const runTicks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };

  it('follows an audio track swapped into the same stream', () => {
    const oldMic = new FakeTrack('audio');
    const local = new FakeMediaStream([new FakeTrack('video'), oldMic]);
    const handle = createCompositeStream([local as unknown as MediaStream]);
    expect(sources.map((s) => s.track)).toEqual([oldMic]);

    // What the SDK does on a device switch: remove + stop the old track, add a new one
    const newMic = new FakeTrack('audio');
    local.removeTrack(oldMic);
    oldMic.stop();
    local.addTrack(newMic);
    runTicks(15);

    expect(sources[0].node.disconnect).toHaveBeenCalled();
    expect(sources.map((s) => s.track)).toEqual([oldMic, newMic]);
    expect(sources[1].node.connect).toHaveBeenCalled();
    handle.cleanup();
  });

  it('picks up an audio track that arrives after the stream was added', () => {
    const remote = new FakeMediaStream([new FakeTrack('video')]);
    const handle = createCompositeStream([remote as unknown as MediaStream]);
    expect(sources).toHaveLength(0);

    const audio = new FakeTrack('audio');
    remote.addTrack(audio);
    runTicks(15);

    expect(sources.map((s) => s.track)).toEqual([audio]);
    handle.cleanup();
  });
});
