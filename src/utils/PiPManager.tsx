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
  talkers?: Talker[];
  streamName: string;
}

interface PiPUpdateOptions {
  participants?: ParticipantData[];
  onMuteToggle?: (streamId: string) => void;
  onVideoToggle?: (streamId: string) => void;
  onVolumeToggle?: (streamId: string) => void;
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
  autoOpen: () => Promise<'document' | 'video' | false>;
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
    width = 800,
    height = 600,
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
  async tryAutoOpen(options?: PiPWindowOptions): Promise<'document' | 'video' | false> {
    if (this.isOpen()) return 'document';

    // 1. Try Document PiP
    if (this.isSupported()) {
      try {
        await this.openWindow(options);
        this.pipRoot!.render(this.lastContent);
        this.notifyState(true);
        return 'document';
      } catch (e) {
        const isDomEx = e instanceof DOMException;
        const isNotAllowed = isDomEx && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
        if (!isNotAllowed) {
          console.error('[PiPManager] tryAutoOpen Document PiP error:', e);
        }
        // Fall through to Video PiP
      }
    }

    // 2. Fallback: standard Video PiP (no user gesture needed from visibilitychange)
    if (document.pictureInPictureEnabled) {
      // Prefer a video that is actively playing
      const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[autoplay]'));
      const playingVideo = videos.find((v) => v.readyState >= 2 && !v.paused) ?? videos[0];

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
      document.exitPictureInPicture().catch(() => { });
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
            style.textContent = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
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
    background: #111;
    overflow: hidden;
    color: #fff;
  }

  .pip-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #111;
  }

  /* ---- Header ---- */
  .pip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    min-height: 38px;
    flex-shrink: 0;
  }

  .pip-title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: rgba(255, 255, 255, 0.85);
  }

  .pip-close-btn {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border: none;
    border-radius: 6px;
    width: 26px;
    height: 26px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    line-height: 1;
    transition: background 0.15s;
  }
  .pip-close-btn:hover { background: rgba(255, 255, 255, 0.18); }

  /* ---- Grid ---- */
  .pip-participants-grid {
    flex: 1;
    display: grid;
    gap: 3px;
    padding: 3px;
    overflow: hidden;
  }

  /* ---- Tile ---- */
  .pip-participant-tile {
    position: relative;
    background: #1e1e1e;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
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

  /* Name pill — always visible */
  .pip-name-pill {
    position: absolute;
    bottom: 6px;
    left: 6px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 12px);
    z-index: 3;
  }

  /* Audio-only view */
  .pip-audio-only {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
    padding: 8px;
  }

  .pip-audio-only-name {
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    color: rgba(255,255,255,0.8);
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
  .pip-empty-icon { font-size: 40px; opacity: 0.4; }
`;

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const pipManager = new PiPManager();

// ---------------------------------------------------------------------------
// React components rendered inside the PiP window
// ---------------------------------------------------------------------------

function getGridStyle(count: number): React.CSSProperties {
  if (count <= 1) return { gridTemplateColumns: '1fr' };
  if (count <= 4) return { gridTemplateColumns: 'repeat(2, 1fr)' };
  if (count <= 9) return { gridTemplateColumns: 'repeat(3, 1fr)' };
  if (count <= 16) return { gridTemplateColumns: 'repeat(4, 1fr)' };
  return { gridTemplateColumns: 'repeat(5, 1fr)' };
}

const PiPParticipant: React.FC<PiPParticipantProps> = ({
  participant,
  mediaStream,
  isSpeaking = false,
  streamName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isLocalUser = participant?.uid === streamName;

  useEffect(() => {
    if (videoRef.current && mediaStream && participant?.videoEnabled) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, participant?.videoEnabled]);

  const label = `${participant?.name || 'Unknown'}${isLocalUser ? ' (You)' : ''}`;

  return (
    <div className="pip-participant-tile">
      {isSpeaking && <div className="pip-speaking-ring" />}

      {participant?.videoEnabled && mediaStream ? (
        <video
          ref={videoRef}
          className="pip-participant-video"
          autoPlay
          playsInline
          muted={isLocalUser}
        />
      ) : (
        <div className="pip-audio-only">
          <Avatar
            src={defaultAvatar}
            sx={{ width: 56, height: 56, opacity: 0.85 }}
          />
          <div className="pip-audio-only-name">{label}</div>
        </div>
      )}

      <div className="pip-name-pill">{label}</div>
    </div>
  );
};

const PiPGridContent: React.FC<PiPGridContentProps> = ({
  participants = [],
  onClose,
  talkers = [],
  streamName,
}) => {
  const speakingIds = talkers.map((t) => t.streamId);

  return (
    <div className="pip-container">
      <div className="pip-header">
        <span className="pip-title">
          Conference · {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </span>
        <button className="pip-close-btn" onClick={onClose} title="Close Picture-in-Picture">
          ×
        </button>
      </div>

      <div className="pip-participants-grid" style={getGridStyle(participants.length)}>
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
      width = 800,
      height = 600,
      onMuteToggle,
      onVideoToggle,
      onVolumeToggle,
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

        // Dynamic sizing by participant count
        const count = participants.length;
        const adjustedWidth =
          count <= 4 ? Math.max(600, width) : count <= 9 ? Math.max(800, width) : Math.max(1000, width);
        const adjustedHeight =
          count <= 4 ? Math.max(400, height) : count <= 9 ? Math.max(600, height) : Math.max(700, height);

        await pipManager.openWindow({
          width: adjustedWidth,
          height: adjustedHeight,
          title: `Conference · ${count} participant${count !== 1 ? 's' : ''}`,
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
  const autoOpen = useCallback(async (): Promise<'document' | 'video' | false> => {
    const result = await pipManager.tryAutoOpen();
    if (result === 'document') setIsOpen(true);
    return result;
  }, []);

  // ---------- autoClose ----------
  const autoClose = useCallback((): void => {
    pipManager.autoClose();
    setIsOpen(false);
    setError(null);
  }, []);

  return { isSupported, isOpen, error, openPiP, updatePiP, closePiP, togglePiP, autoOpen, autoClose };
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
      <IconButton onClick={handleClick} disabled={disabled} size={size} color={isOpen ? 'primary' : 'default'}>
        <PictureInPicture />
      </IconButton>
    </Tooltip>
  );
};

export default pipManager;
