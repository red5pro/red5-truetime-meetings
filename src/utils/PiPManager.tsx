import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Avatar } from '@mui/material';
import { PictureInPicture, PictureInPictureAlt } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import defaultAvatar from '../static/images/defaultAvatar.png';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Participant {
  uid: string;
  name?: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface ParticipantData {
  participant: Participant;
  mediaStream?: MediaStream;
}

interface Talker {
  streamId: string;
}

interface PiPWindowOptions {
  width?: number;
  height?: number;
  title?: string;
}

export interface PiPOpenOptions {
  participants?: ParticipantData[];
  width?: number;
  height?: number;
  onMuteToggle?: (streamId: string) => void;
  onVideoToggle?: (streamId: string) => void;
  onVolumeToggle?: (streamId: string) => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
  onLeaveRoom?: () => void;
  isMyMicMuted?: boolean;
  isMyCamTurnedOff?: boolean;
  isScreenShared?: boolean;
  screenShareStream?: MediaStream;
  talkers?: Talker[];
  streamName: string;
}

interface PiPUpdateOptions {
  participants?: ParticipantData[];
  onMuteToggle?: (streamId: string) => void;
  onVideoToggle?: (streamId: string) => void;
  onVolumeToggle?: (streamId: string) => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
  onLeaveRoom?: () => void;
  isMyMicMuted?: boolean;
  isMyCamTurnedOff?: boolean;
  isScreenShared?: boolean;
  screenShareStream?: MediaStream;
  talkers?: Talker[];
  streamName: string;
}

interface PiPParticipantProps {
  participant: Participant;
  mediaStream?: MediaStream;
  isSpeaking?: boolean;
  streamName: string;
}

interface PiPGridContentProps {
  participants?: ParticipantData[];
  onClose: () => void;
  onMuteToggle?: (streamId: string) => void;
  onVideoToggle?: (streamId: string) => void;
  onVolumeToggle?: (streamId: string) => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
  onLeaveRoom?: () => void;
  isMyMicMuted?: boolean;
  isMyCamTurnedOff?: boolean;
  isScreenShared?: boolean;
  screenShareStream?: MediaStream;
  talkers?: Talker[];
  streamName: string;
}

interface PiPButtonProps {
  participants?: ParticipantData[];
  onMuteToggle?: (streamId: string) => void;
  onVideoToggle?: (streamId: string) => void;
  onVolumeToggle?: (streamId: string) => void;
  talkers?: Talker[];
  streamName: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface UsePictureInPictureReturn {
  isSupported: boolean;
  isOpen: boolean;
  error: string | null;
  openPiP: (options: PiPOpenOptions) => Promise<boolean>;
  updatePiP: (options: PiPUpdateOptions) => void;
  closePiP: () => void;
  togglePiP: (options: PiPOpenOptions) => Promise<boolean>;
  /** Auto-open: tries Document PiP first, falls back to Video PiP if user activation is missing */
  autoOpen: (options?: PiPOpenOptions) => Promise<'document' | 'video' | false>;
  /** Close both Document PiP and standard Video PiP */
  autoClose: () => void;
}

// Extend Window for Document PiP API
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options: { width: number; height: number }) => Promise<Window>;
    };
  }
}

// ---------------------------------------------------------------------------
// PiPManager — singleton class, no React
// ---------------------------------------------------------------------------

/**
 * Manages the Document Picture-in-Picture window lifecycle.
 * Uses an event-based pub/sub model instead of polling.
 */
class PiPManager {
  private pipWindow: Window | null = null;
  private pipRoot: Root | null = null;
  private pipContainer: HTMLElement | null = null;

  /** Survives close/reopen cycles — used to sync hook state */
  private stateListeners = new Set<(open: boolean) => void>();

  /** Last rendered content — enables seamless reopen without re-passing all options */
  private lastContent: React.ReactElement | null = null;

  // ---------------------------------------------------------------------------
  // Public query API
  // ---------------------------------------------------------------------------

  isSupported(): boolean {
    return 'documentPictureInPicture' in window;
  }

  isOpen(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
  }

  // ---------------------------------------------------------------------------
  // State pub/sub (replaces setInterval polling)
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to open/close state changes.
   * Returns an unsubscribe function.
   */
  onStateChange(listener: (open: boolean) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyState(open: boolean): void {
    this.stateListeners.forEach((cb) => {
      try {
        cb(open);
      } catch (e) {
        console.warn('[PiPManager] state listener error:', e);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Open / render / close
  // ---------------------------------------------------------------------------

  async openWindow({
    width = 360,
    height = 640,
    title = 'Video Conference',
  }: PiPWindowOptions = {}): Promise<Window> {
    if (!this.isSupported()) {
      throw new Error('Document Picture-in-Picture is not supported in this browser');
    }

    if (this.isOpen()) {
      this.pipWindow!.focus();
      return this.pipWindow!;
    }

    this.pipWindow = await window.documentPictureInPicture!.requestWindow({ width, height });
    this.pipWindow.document.title = title;

    this.copyStyles();
    this.setupCloseHandlers();

    // Create a stable React root container (reused across renders)
    this.pipContainer = this.pipWindow.document.createElement('div');
    this.pipContainer.id = 'pip-root';
    this.pipWindow.document.body.appendChild(this.pipContainer);
    this.pipRoot = createRoot(this.pipContainer);

    return this.pipWindow;
  }

  /** Render (or re-render) content into the PiP window without tearing down the React root */
  renderContent(content: React.ReactElement): void {
    if (!this.pipWindow || !this.pipRoot) return;
    this.lastContent = content;
    // createRoot.render() does an in-place reconcile — no DOM teardown
    this.pipRoot.render(content);
  }

  close(): void {
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.close();
    }
    this.cleanup();
  }

  // ---------------------------------------------------------------------------
  // Auto-open: Document PiP → Video PiP fallback
  // ---------------------------------------------------------------------------

  /**
   * Attempt to open PiP in the best available mode.
   *
   * Priority:
   *   1. Document PiP  — rich multi-participant view, requires user activation
   *   2. Video PiP     — single video fallback, allowed from `visibilitychange` w/o gesture
   *
   * Returns: 'document' | 'video' | false
   */
  async tryAutoOpen(
    content?: React.ReactElement,
    options?: PiPWindowOptions,
  ): Promise<'document' | 'video' | false> {
    if (this.isOpen()) return 'document';

    // 1. Try Document PiP
    if (this.isSupported()) {
      try {
        await this.openWindow(options);
        const contentToRender = content ?? this.lastContent;
        this.pipRoot!.render(contentToRender);
        this.lastContent = contentToRender;
        this.notifyState(true);
        return 'document';
      } catch (e) {
        const isDomEx = e instanceof DOMException;
        const isNotAllowed =
          isDomEx && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
        if (!isNotAllowed) {
          console.error('[PiPManager] tryAutoOpen Document PiP error:', e);
        }
        // Fall through to Video PiP
      }
    }

    // 2. Fallback: standard Video PiP (no user gesture needed from visibilitychange).
    // Only consider remote participants' videos — the local self-view (#red5pro-publisher)
    // is always muted and would otherwise be picked up silently, per the DOM id convention
    // used in AutoLayout/PinnedLayout/TiledLayout (`red5pro-subscriber-${uid}`).
    if (document.pictureInPictureEnabled) {
      const videos = Array.from(
        document.querySelectorAll<HTMLVideoElement>('video[id^="red5pro-subscriber-"]'),
      );
      const playingVideo =
        videos.find((v) => v.readyState >= 2 && !v.paused && !v.muted) ??
        videos.find((v) => v.readyState >= 2 && !v.paused) ??
        videos[0];

      if (playingVideo) {
        try {
          await playingVideo.requestPictureInPicture();
          return 'video';
        } catch (e) {
          console.warn('[PiPManager] Video PiP fallback failed:', e);
        }
      }
    }

    return false;
  }

  /** Close both Document PiP and standard Video PiP */
  autoClose(): void {
    this.close();
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private copyStyles(): void {
    if (!this.pipWindow) return;

    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = this.pipWindow!.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            this.pipWindow!.document.head.appendChild(link);
          } else if (sheet.ownerNode && sheet.cssRules) {
            const style = this.pipWindow!.document.createElement('style');
            style.textContent = Array.from(sheet.cssRules)
              .map((r) => r.cssText)
              .join('\n');
            this.pipWindow!.document.head.appendChild(style);
          }
        } catch {
          // CORS-restricted sheets — skip silently
        }
      });
    } catch (e) {
      console.warn('[PiPManager] copyStyles error:', e);
    }

    // Inject PiP-specific styles
    const style = this.pipWindow!.document.createElement('style');
    style.textContent = PIP_STYLES;
    this.pipWindow!.document.head.appendChild(style);
  }

  private setupCloseHandlers(): void {
    if (!this.pipWindow) return;

    const onClose = () => {
      this.cleanup();
    };

    this.pipWindow.addEventListener('pagehide', onClose, { once: true });
    this.pipWindow.addEventListener('beforeunload', onClose, { once: true });
  }

  private cleanup(): void {
    // Dispose React root
    try {
      this.pipRoot?.unmount();
    } catch {
      // ignore
    }
    this.pipRoot = null;
    this.pipContainer = null;
    this.pipWindow = null;

    // Notify subscribers — state listeners persist across sessions
    this.notifyState(false);
  }
}

// ---------------------------------------------------------------------------
// PiP window styles
// ---------------------------------------------------------------------------

const PIP_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a1a;
    overflow: hidden;
    color: #fff;
  }

  .pip-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
  }

  /* ---- Header ---- */
  .pip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    min-height: 36px;
    flex-shrink: 0;
  }

  .pip-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: rgba(255, 255, 255, 0.85);
  }

  .pip-close-btn {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border: none;
    border-radius: 6px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 1;
    transition: background 0.15s;
  }
  .pip-close-btn:hover { background: rgba(255, 255, 255, 0.18); }

  /* ---- Grid (scrollable, always 2 columns) ---- */
  .pip-participants-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(120px, 1fr);
    gap: 4px;
    padding: 4px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Scrollbar styling */
  .pip-participants-grid::-webkit-scrollbar {
    width: 4px;
  }
  .pip-participants-grid::-webkit-scrollbar-track {
    background: transparent;
  }
  .pip-participants-grid::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
  .pip-participants-grid::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.35);
  }

  /* Single participant: full width */
  .pip-participants-grid.single-participant {
    grid-template-columns: 1fr;
  }

  /* ---- Tile ---- */
  .pip-participant-tile {
    position: relative;
    background: #2a2a2a;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
  }

  .pip-participant-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Speaking ring */
  .pip-speaking-ring {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    border: 2px solid #4caf50;
    pointer-events: none;
    animation: speakPulse 1.4s ease-in-out infinite;
    z-index: 2;
  }

  @keyframes speakPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }

  /* Name pill */
  .pip-name-pill {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 8px);
    z-index: 3;
  }

  /* Audio-only view */
  .pip-audio-only {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 6px;
    padding: 8px;
    background: #2a2a2a;
    z-index: 1;
  }

  .pip-audio-only-name {
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    color: rgba(255,255,255,0.8);
  }

  /* Tap-to-unmute affordance (shown when autoplay-with-sound is blocked) */
  .pip-unmute-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(217, 48, 37, 0.85);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 9px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    z-index: 4;
  }

  /* Empty state */
  .pip-empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.4);
    gap: 10px;
  }
  .pip-empty-icon { font-size: 36px; opacity: 0.4; }

  /* ---- Screen Share Layout ---- */
  .pip-screenshare-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pip-screenshare-main {
    flex: 1;
    min-height: 0;
    padding: 4px 4px 2px;
  }

  .pip-screenshare-main .pip-participant-tile {
    width: 100%;
    height: 100%;
    border-radius: 10px;
  }

  .pip-screenshare-strip {
    flex-shrink: 0;
    display: flex;
    gap: 4px;
    padding: 2px 4px 4px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .pip-screenshare-strip::-webkit-scrollbar {
    height: 3px;
  }
  .pip-screenshare-strip::-webkit-scrollbar-track {
    background: transparent;
  }
  .pip-screenshare-strip::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  .pip-screenshare-strip .pip-participant-tile {
    flex-shrink: 0;
    width: 115px;
    height: 86px;
    border-radius: 8px;
    min-height: unset;
  }

  .pip-screenshare-strip .pip-name-pill {
    font-size: 8px;
    padding: 1px 4px;
    bottom: 2px;
    left: 2px;
  }

  /* ---- Control Bar ---- */
  .pip-control-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }

  .pip-ctrl-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .pip-ctrl-btn:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  .pip-ctrl-btn.active {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .pip-ctrl-btn.muted {
    background: #d93025;
    color: #fff;
  }
  .pip-ctrl-btn.muted:hover {
    background: #c12a1f;
  }

  .pip-ctrl-btn.end-call {
    background: #d93025;
    color: #fff;
    width: 44px;
    height: 44px;
  }
  .pip-ctrl-btn.end-call:hover {
    background: #b71c1c;
  }

  .pip-ctrl-btn svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  .pip-ctrl-btn.end-call svg {
    width: 22px;
    height: 22px;
  }
`;

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const pipManager = new PiPManager();

// ---------------------------------------------------------------------------
// React components rendered inside the PiP window
// ---------------------------------------------------------------------------

// SVG Icons for PiP control bar (inline to avoid MUI dependency in PiP window)
const MicIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
  </svg>
);

const MicOffIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
  </svg>
);

const VideocamIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);

const VideocamOffIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
  </svg>
);

const ScreenShareIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zm-7-3.53v-2.19c-2.78 0-4.61.85-6 2.72.56-2.67 2.11-5.33 6-5.87V7l4 3.73-4 3.74z" />
  </svg>
);

const StopScreenShareIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M21.22 18.02l2 2H24v-2h-2.78zm.77-2l.01-10c0-1.11-.9-2-2-2H7.22l5.23 5.23c.18-.04.36-.07.55-.1V7l4 3.73-1.58 1.47 5.54 5.54c.61-.33 1.03-.93 1.03-1.72zM2.39 1.73L1.11 3l1.54 1.54c-.4.36-.65.89-.65 1.46v10c0 1.1.89 2 2 2H0v2h18.13l2.71 2.71 1.27-1.27L2.39 1.73zM4 6.27L14.73 17H4V6.27z" />
  </svg>
);

const CallEndIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

const PiPParticipant: React.FC<PiPParticipantProps> = ({
  participant,
  mediaStream,
  isSpeaking = false,
  streamName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isLocalUser = participant?.uid === streamName;
  const showVideo = Boolean(participant?.videoEnabled && mediaStream);
  const [needsUnmute, setNeedsUnmute] = useState(false);

  // Always attach the stream (audio track must keep playing even when video is off), and
  // drive playback explicitly rather than relying on the `autoplay` attribute: unmuted
  // autoplay can be silently blocked (frozen frame, no sound, no error surfaced) unless the
  // window still has a fresh user-activation grant. When play() is rejected, fall back to a
  // muted play (always allowed) and surface a tap-to-unmute affordance — clicking inside the
  // PiP window is itself a genuine user gesture, so the retry there reliably succeeds.
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !mediaStream) return;

    videoEl.srcObject = mediaStream;
    videoEl.muted = isLocalUser;
    setNeedsUnmute(false);

    videoEl.play().catch(() => {
      if (isLocalUser) return;
      videoEl.muted = true;
      setNeedsUnmute(true);
      videoEl.play().catch(() => {});
    });
  }, [mediaStream, isLocalUser]);

  const handleUnmute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = false;
    videoEl.play().then(
      () => setNeedsUnmute(false),
      () => {
        videoEl.muted = true;
        setNeedsUnmute(true);
      },
    );
  };

  const label = `${participant?.name || 'Unknown'}${isLocalUser ? ' (You)' : ''}`;

  return (
    <div
      className="pip-participant-tile"
      onClick={needsUnmute ? handleUnmute : undefined}
      style={needsUnmute ? { cursor: 'pointer' } : undefined}
    >
      {isSpeaking && <div className="pip-speaking-ring" />}

      {/* Kept mounted (not unmounted on camera-off) so the audio track never stops playing */}
      <video
        ref={videoRef}
        className="pip-participant-video"
        playsInline
        style={{
          visibility: showVideo ? 'visible' : 'hidden',
          ...(isLocalUser ? { transform: 'scaleX(-1)' } : {}),
        }}
      />

      {!showVideo && (
        <div className="pip-audio-only">
          <Avatar src={defaultAvatar} sx={{ width: 56, height: 56, opacity: 0.85 }} />
          <div className="pip-audio-only-name">{label}</div>
        </div>
      )}

      {needsUnmute && <div className="pip-unmute-badge">🔇 Tap to unmute</div>}

      <div className="pip-name-pill">{label}</div>
    </div>
  );
};

const PiPControlBar: React.FC<{
  isMyMicMuted?: boolean;
  isMyCamTurnedOff?: boolean;
  isScreenShared?: boolean;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
  onLeaveRoom?: () => void;
}> = ({
  isMyMicMuted = false,
  isMyCamTurnedOff = false,
  isScreenShared = false,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveRoom,
}) => {
  return (
    <div className="pip-control-bar">
      <button
        className={`pip-ctrl-btn ${isMyMicMuted ? 'muted' : 'active'}`}
        onClick={onToggleMic}
        title={isMyMicMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMyMicMuted ? <MicOffIcon /> : <MicIcon />}
      </button>

      <button
        className={`pip-ctrl-btn ${isMyCamTurnedOff ? 'muted' : 'active'}`}
        onClick={onToggleCamera}
        title={isMyCamTurnedOff ? 'Turn on camera' : 'Turn off camera'}
      >
        {isMyCamTurnedOff ? <VideocamOffIcon /> : <VideocamIcon />}
      </button>

      <button
        className={`pip-ctrl-btn ${isScreenShared ? 'active' : ''}`}
        onClick={onToggleScreenShare}
        title={isScreenShared ? 'Stop sharing' : 'Share screen'}
      >
        {isScreenShared ? <StopScreenShareIcon /> : <ScreenShareIcon />}
      </button>

      <button className="pip-ctrl-btn end-call" onClick={onLeaveRoom} title="Leave meeting">
        <CallEndIcon />
      </button>
    </div>
  );
};

const PiPGridContent: React.FC<PiPGridContentProps> = ({
  participants = [],
  onClose,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveRoom,
  isMyMicMuted,
  isMyCamTurnedOff,
  isScreenShared,
  screenShareStream,
  talkers = [],
  streamName,
}) => {
  const speakingIds = talkers.map((t) => t.streamId);
  const gridClass = `pip-participants-grid${participants.length <= 1 ? ' single-participant' : ''}`;

  // Screen share video component
  const PiPScreenShareVideo: React.FC<{ stream?: MediaStream }> = ({ stream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    if (!stream) return null;

    return (
      <div className="pip-participant-tile">
        <video ref={videoRef} className="pip-participant-video" autoPlay playsInline muted />
        <div className="pip-name-pill">Screen Share</div>
      </div>
    );
  };

  // When screen is shared, show the screen share video on top and all participants in a strip below
  const renderScreenShareLayout = () => {
    // Filter out the screen share participant entry (joins with uid containing '-screenshare')
    const stripParticipants = screenShareStream
      ? participants.filter((pd) => {
          const uid = pd.participant?.uid || '';
          return !uid.includes('screenshare');
        })
      : participants;

    return (
      <div className="pip-screenshare-layout">
        <div className="pip-screenshare-main">
          {screenShareStream ? (
            <PiPScreenShareVideo stream={screenShareStream} />
          ) : (
            // Fallback: show first participant (local user) if no screen share stream
            participants[0] && (
              <PiPParticipant
                participant={participants[0].participant}
                mediaStream={participants[0].mediaStream}
                isSpeaking={speakingIds.includes(participants[0].participant?.uid)}
                streamName={streamName}
              />
            )
          )}
        </div>
        {stripParticipants.length > 0 && (
          <div className="pip-screenshare-strip">
            {stripParticipants.map((pd, i) => (
              <PiPParticipant
                key={pd.participant?.uid ?? i}
                participant={pd.participant}
                mediaStream={pd.mediaStream}
                isSpeaking={speakingIds.includes(pd.participant?.uid)}
                streamName={streamName}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNormalGrid = () => (
    <div className={gridClass}>
      {participants.length > 0 ? (
        participants.map((pd, i) => (
          <PiPParticipant
            key={pd.participant?.uid ?? i}
            participant={pd.participant}
            mediaStream={pd.mediaStream}
            isSpeaking={speakingIds.includes(pd.participant?.uid)}
            streamName={streamName}
          />
        ))
      ) : (
        <div className="pip-empty-state">
          <div className="pip-empty-icon">📹</div>
          <div>No participants to display</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="pip-container">
      <div className="pip-header">
        <span className="pip-title">
          {isScreenShared ? 'Screen Sharing' : 'Conference'} · {participants.length} participant
          {participants.length !== 1 ? 's' : ''}
        </span>
        <button className="pip-close-btn" onClick={onClose} title="Close Picture-in-Picture">
          ×
        </button>
      </div>

      {isScreenShared ? renderScreenShareLayout() : renderNormalGrid()}

      <PiPControlBar
        isMyMicMuted={isMyMicMuted}
        isMyCamTurnedOff={isMyCamTurnedOff}
        isScreenShared={isScreenShared}
        onToggleMic={onToggleMic}
        onToggleCamera={onToggleCamera}
        onToggleScreenShare={onToggleScreenShare}
        onLeaveRoom={onLeaveRoom}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// usePictureInPicture hook
// ---------------------------------------------------------------------------

export const usePictureInPicture = (): UsePictureInPictureReturn => {
  const [isSupported] = useState(() => pipManager.isSupported());
  const [isOpen, setIsOpen] = useState(() => pipManager.isOpen());
  const [error, setError] = useState<string | null>(null);

  // Event-based state sync — no more setInterval polling
  useEffect(() => {
    setIsOpen(pipManager.isOpen());
    return pipManager.onStateChange(setIsOpen);
  }, []);

  // ---------- openPiP ----------
  const openPiP = useCallback(
    async ({
      participants = [],
      width = 360,
      height = 640,
      onMuteToggle,
      onVideoToggle,
      onVolumeToggle,
      onToggleMic,
      onToggleCamera,
      onToggleScreenShare,
      onLeaveRoom,
      isMyMicMuted,
      isMyCamTurnedOff,
      isScreenShared,
      screenShareStream,
      talkers = [],
      streamName,
    }: PiPOpenOptions): Promise<boolean> => {
      if (!isSupported) {
        const msg = 'Picture-in-Picture is not supported. Please use Chrome 111+ or Edge 111+';
        setError(msg);
        return false;
      }

      try {
        setError(null);

        await pipManager.openWindow({
          width,
          height,
          title: `Conference · ${participants.length} participant${participants.length !== 1 ? 's' : ''}`,
        });

        pipManager.renderContent(
          <PiPGridContent
            participants={participants}
            onClose={() => {
              setIsOpen(false);
              pipManager.close();
            }}
            onMuteToggle={onMuteToggle}
            onVideoToggle={onVideoToggle}
            onVolumeToggle={onVolumeToggle}
            onToggleMic={onToggleMic}
            onToggleCamera={onToggleCamera}
            onToggleScreenShare={onToggleScreenShare}
            onLeaveRoom={onLeaveRoom}
            isMyMicMuted={isMyMicMuted}
            isMyCamTurnedOff={isMyCamTurnedOff}
            isScreenShared={isScreenShared}
            screenShareStream={screenShareStream}
            talkers={talkers}
            streamName={streamName}
          />,
        );

        setIsOpen(true);
        return true;
      } catch (err) {
        const msg = (err as Error).message || 'Failed to open Picture-in-Picture';
        setError(msg);
        console.error('[PiP] openPiP error:', err);
        return false;
      }
    },
    [isSupported],
  );

  // ---------- updatePiP ----------
  const updatePiP = useCallback(
    ({
      participants = [],
      onMuteToggle,
      onVideoToggle,
      onVolumeToggle,
      onToggleMic,
      onToggleCamera,
      onToggleScreenShare,
      onLeaveRoom,
      isMyMicMuted,
      isMyCamTurnedOff,
      isScreenShared,
      screenShareStream,
      talkers = [],
      streamName,
    }: PiPUpdateOptions): void => {
      if (!pipManager.isOpen()) return;

      // renderContent does an in-place React reconcile — no DOM teardown
      pipManager.renderContent(
        <PiPGridContent
          participants={participants}
          onClose={() => {
            setIsOpen(false);
            pipManager.close();
          }}
          onMuteToggle={onMuteToggle}
          onVideoToggle={onVideoToggle}
          onVolumeToggle={onVolumeToggle}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onLeaveRoom={onLeaveRoom}
          isMyMicMuted={isMyMicMuted}
          isMyCamTurnedOff={isMyCamTurnedOff}
          isScreenShared={isScreenShared}
          screenShareStream={screenShareStream}
          talkers={talkers}
          streamName={streamName}
        />,
      );
    },
    [],
  );

  // ---------- closePiP ----------
  const closePiP = useCallback((): void => {
    pipManager.close();
    setIsOpen(false);
    setError(null);
  }, []);

  // ---------- togglePiP ----------
  const togglePiP = useCallback(
    (options: PiPOpenOptions): Promise<boolean> => {
      if (isOpen) {
        closePiP();
        return Promise.resolve(true);
      }
      return openPiP(options);
    },
    [isOpen, openPiP, closePiP],
  );

  // ---------- autoOpen ----------
  const autoOpen = useCallback(
    async (options?: PiPOpenOptions): Promise<'document' | 'video' | false> => {
      const content = options ? (
        <PiPGridContent
          participants={options.participants}
          onClose={() => {
            setIsOpen(false);
            pipManager.close();
          }}
          onMuteToggle={options.onMuteToggle}
          onVideoToggle={options.onVideoToggle}
          onVolumeToggle={options.onVolumeToggle}
          onToggleMic={options.onToggleMic}
          onToggleCamera={options.onToggleCamera}
          onToggleScreenShare={options.onToggleScreenShare}
          onLeaveRoom={options.onLeaveRoom}
          isMyMicMuted={options.isMyMicMuted}
          isMyCamTurnedOff={options.isMyCamTurnedOff}
          isScreenShared={options.isScreenShared}
          screenShareStream={options.screenShareStream}
          talkers={options.talkers}
          streamName={options.streamName}
        />
      ) : undefined;

      const result = await pipManager.tryAutoOpen(content);
      if (result === 'document') setIsOpen(true);
      return result;
    },
    [],
  );

  // ---------- autoClose ----------
  const autoClose = useCallback((): void => {
    pipManager.autoClose();
    setIsOpen(false);
    setError(null);
  }, []);

  return {
    isSupported,
    isOpen,
    error,
    openPiP,
    updatePiP,
    closePiP,
    togglePiP,
    autoOpen,
    autoClose,
  };
};

// ---------------------------------------------------------------------------
// Exported PiP button (used in PiPButton.tsx via re-export or internally)
// ---------------------------------------------------------------------------

export const PiPButton: React.FC<PiPButtonProps> = ({
  participants = [],
  onMuteToggle,
  onVideoToggle,
  onVolumeToggle,
  talkers = [],
  streamName,
  disabled = false,
  size = 'medium',
}) => {
  const { isSupported, isOpen, error, togglePiP } = usePictureInPicture();

  const handleClick = (): void => {
    if (!isSupported) return;
    togglePiP({ participants, onMuteToggle, onVideoToggle, onVolumeToggle, talkers, streamName });
  };

  if (!isSupported) {
    return (
      <Tooltip title="Picture-in-Picture not supported (Chrome 111+ required)">
        <span>
          <IconButton disabled size={size}>
            <PictureInPictureAlt />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={
        error ||
        (isOpen
          ? 'Close Picture-in-Picture'
          : `Open Picture-in-Picture (${participants.length} participant${participants.length !== 1 ? 's' : ''})`)
      }
    >
      <IconButton
        onClick={handleClick}
        disabled={disabled}
        size={size}
        color={isOpen ? 'primary' : 'default'}
      >
        <PictureInPicture />
      </IconButton>
    </Tooltip>
  );
};

export default pipManager;
