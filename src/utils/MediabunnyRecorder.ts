/**
 * MediabunnyRecorder - A wrapper class for recording MediaStreams using mediabunny
 *
 * This class provides an interface similar to MediaRecorder but uses mediabunny's
 * WebCodecs-based encoding for better performance and proper duration metadata.
 */
import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  MediaStreamVideoTrackSource,
  MediaStreamAudioTrackSource,
  QUALITY_MEDIUM,
  type Quality,
} from 'mediabunny';

export interface RecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  estimatedSize: number;
  state: 'inactive' | 'recording' | 'paused' | null;
  startTime: number | null;
}

export interface RecordingOptions {
  videoBitrate?: number | Quality;
  audioBitrate?: number | Quality;
  videoCodec?: 'avc' | 'vp9' | 'vp8';
  audioCodec?: 'aac' | 'opus';
}

const DEFAULT_OPTIONS: Required<RecordingOptions> = {
  videoBitrate: QUALITY_MEDIUM,
  audioBitrate: QUALITY_MEDIUM,
  videoCodec: 'avc',
  audioCodec: 'aac',
};

/**
 * MediabunnyRecorder class for recording MediaStreams to MP4 format
 * using mediabunny's WebCodecs-based encoding.
 */
export class MediabunnyRecorder {
  private output: Output | null = null;
  private videoSource: MediaStreamVideoTrackSource | null = null;
  private audioSource: MediaStreamAudioTrackSource | null = null;
  private target: BufferTarget | null = null;

  private _isRecording = false;
  private _isPaused = false;
  private recordedBlob: Blob | null = null;
  private startTime: number | null = null;
  private options: Required<RecordingOptions>;

  // Event callbacks (similar to MediaRecorder interface)
  public onstart: (() => void) | null = null;
  public onstop: ((blob: Blob) => void) | null = null;
  public onerror: ((error: Error) => void) | null = null;
  public onpause: (() => void) | null = null;
  public onresume: (() => void) | null = null;

  constructor(options: RecordingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start recording from the provided MediaStream
   * @param stream - The MediaStream to record
   */
  async start(stream: MediaStream): Promise<void> {
    if (this._isRecording) {
      throw new Error('Recording is already in progress');
    }

    try {
      // Create the output target
      this.target = new BufferTarget();

      // Create the output with MP4 format for proper duration metadata
      this.output = new Output({
        format: new Mp4OutputFormat({
          fastStart: 'in-memory', // Ensures duration metadata is correct
        }),
        target: this.target,
      });

      // Add video track if present
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        this.videoSource = new MediaStreamVideoTrackSource(videoTrack, {
          codec: this.options.videoCodec,
          bitrate: this.options.videoBitrate,
        });
        this.output.addVideoTrack(this.videoSource);
      }

      // Add audio track if present
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        this.audioSource = new MediaStreamAudioTrackSource(audioTrack, {
          codec: this.options.audioCodec,
          bitrate: this.options.audioBitrate,
        });
        this.output.addAudioTrack(this.audioSource);
      }

      // mediabunny encodes track sources asynchronously and surfaces failures via
      // `errorPromise`. Without consuming it, an audio/video encoding error (e.g. an
      // unsupported codec) silently drops that track's data instead of reaching onerror.
      this.videoSource?.errorPromise.catch((error) => this.handleSourceError(error));
      this.audioSource?.errorPromise.catch((error) => this.handleSourceError(error));

      // Start the output
      await this.output.start();

      this._isRecording = true;
      this._isPaused = false;
      this.startTime = Date.now();
      this.recordedBlob = null;

      if (this.onstart) {
        this.onstart();
      }
    } catch (error) {
      this._isRecording = false;
      if (this.onerror) {
        this.onerror(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  /**
   * Stop recording and finalize the output
   * @returns The recorded Blob or null if no recording
   */
  async stop(): Promise<Blob | null> {
    if (!this._isRecording || !this.output) {
      console.warn('No recording in progress');
      return null;
    }

    try {
      // Finalize the output
      await this.output.finalize();

      // Get the recorded data from the buffer target
      if (this.target && this.target.buffer) {
        this.recordedBlob = new Blob([this.target.buffer], { type: 'video/mp4' });
      }

      this._isRecording = false;
      this._isPaused = false;

      if (this.onstop && this.recordedBlob) {
        this.onstop(this.recordedBlob);
      }

      return this.recordedBlob;
    } catch (error) {
      if (this.onerror) {
        this.onerror(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Cancel the recording without saving
   */
  async cancel(): Promise<void> {
    if (!this._isRecording || !this.output) {
      return;
    }

    try {
      await this.output.cancel();
    } catch (error) {
      console.error('Error canceling recording:', error);
    } finally {
      this._isRecording = false;
      this._isPaused = false;
      this.cleanup();
    }
  }

  /**
   * Pause the recording
   */
  pause(): void {
    if (!this._isRecording || this._isPaused) {
      return;
    }

    // Pause the sources
    if (this.videoSource) {
      this.videoSource.pause();
    }
    if (this.audioSource) {
      this.audioSource.pause();
    }

    this._isPaused = true;

    if (this.onpause) {
      this.onpause();
    }
  }

  /**
   * Resume a paused recording
   */
  resume(): void {
    if (!this._isRecording || !this._isPaused) {
      return;
    }

    // Resume the sources
    if (this.videoSource) {
      this.videoSource.resume();
    }
    if (this.audioSource) {
      this.audioSource.resume();
    }

    this._isPaused = false;

    if (this.onresume) {
      this.onresume();
    }
  }

  /**
   * Get the current recording state (compatible with MediaRecorder.state)
   */
  get state(): 'inactive' | 'recording' | 'paused' {
    if (!this._isRecording) {
      return 'inactive';
    }
    return this._isPaused ? 'paused' : 'recording';
  }

  /**
   * Get the MIME type of the recording
   */
  get mimeType(): string {
    return 'video/mp4';
  }

  /**
   * Check if recording is active
   */
  get isRecording(): boolean {
    return this._isRecording;
  }

  /**
   * Check if recording is paused
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Get the recorded blob (available after stop())
   */
  getBlob(): Blob | null {
    return this.recordedBlob;
  }

  /**
   * Get the current recording status
   */
  getStatus(): RecordingStatus {
    return {
      isRecording: this._isRecording,
      isPaused: this._isPaused,
      estimatedSize: this.recordedBlob?.size ?? 0,
      state: this.state,
      startTime: this.startTime,
    };
  }

  /**
   * Handle an async error reported by a track source's errorPromise
   */
  private handleSourceError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    if (this.onerror) {
      this.onerror(err);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.output = null;
    this.videoSource = null;
    this.audioSource = null;
    this.target = null;
  }
}

export default MediabunnyRecorder;
