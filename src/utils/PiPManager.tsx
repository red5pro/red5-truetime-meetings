import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Box, IconButton, Tooltip, Avatar } from '@mui/material';
import { PictureInPicture, PictureInPictureAlt } from '@mui/icons-material';
import defaultAvatar from '../static/images/defaultAvatar.png';

// Types
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

interface PiPOpenOptions {
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
  onMuteToggle?: (streamId: string) => void;
  onVideoToggle?: (streamId: string) => void;
  onVolumeToggle?: (streamId: string) => void;
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

interface UsePictureInPictureReturn {
  isSupported: boolean;
  isOpen: boolean;
  error: string | null;
  openPiP: (options: PiPOpenOptions) => Promise<boolean>;
  updatePiP: (options: PiPUpdateOptions) => void;
  closePiP: () => void;
  togglePiP: (options: PiPOpenOptions) => Promise<boolean>;
}

// Extend the Window interface to include documentPictureInPicture
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options: { width: number; height: number }) => Promise<Window>;
    };
  }
}

/**
 * Document Picture-in-Picture API Integration
 * This component manages the creation and control of PiP windows with all participants
 */
class PiPManager {
  private pipWindow: Window | null = null;
  private pipRoot: Root | null = null;
  private onCloseCallbacks: Array<() => void> = [];

  // Check if PiP is supported
  isSupported(): boolean {
    return 'documentPictureInPicture' in window;
  }

  // Check if PiP window is currently open
  isOpen(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
  }

  // Open PiP window
  async openWindow({
    width = 800,
    height = 600,
    title = 'Video Conference',
  }: PiPWindowOptions = {}): Promise<Window> {
    if (!this.isSupported()) {
      throw new Error('Document Picture-in-Picture is not supported in this browser');
    }

    if (this.isOpen()) {
      // Focus existing window
      this.pipWindow!.focus();
      return this.pipWindow!;
    }

    try {
      // Request PiP window with larger size for multiple participants
      this.pipWindow = await window.documentPictureInPicture!.requestWindow({
        width,
        height,
      });

      // Set window title
      this.pipWindow.document.title = title;

      // Copy styles from parent window
      this.copyStyles();

      // Setup close handlers
      this.setupCloseHandlers();

      return this.pipWindow;
    } catch (error) {
      console.error('Failed to open PiP window:', error);
      throw error;
    }
  }

  // Copy CSS styles from main window to PiP window
  private copyStyles(): void {
    if (!this.pipWindow) return;

    try {
      // Copy all stylesheets
      const styleSheets = Array.from(document.styleSheets);

      styleSheets.forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            // External stylesheet
            const link = this.pipWindow!.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            this.pipWindow!.document.head.appendChild(link);
          } else if (styleSheet.ownerNode && styleSheet.cssRules) {
            // Inline stylesheet
            const style = this.pipWindow!.document.createElement('style');
            style.textContent = Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join('\n');
            this.pipWindow!.document.head.appendChild(style);
          }
        } catch (e) {
          // Some stylesheets might not be accessible due to CORS
          console.warn('Could not copy stylesheet:', e);
        }
      });
    } catch (e) {
      console.warn('Error copying styles:', e);
    }

    // Add enhanced PiP-specific styles for grid layout
    const pipStyles = this.pipWindow.document.createElement('style');
    pipStyles.textContent = `
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        background: #1a1a1a;
        overflow: hidden;
      }
      
      .pip-container {
        width: 100vw;
        height: 100vh;
        position: relative;
        display: flex;
        flex-direction: column;
        background: #1a1a1a;
      }
      
      .pip-header {
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 40px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      
      .pip-title {
        font-size: 14px;
        font-weight: 500;
      }
      
      .pip-close-btn {
        background: rgba(255,255,255,0.1);
        color: white;
        border: none;
        border-radius: 4px;
        width: 28px;
        height: 28px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: background 0.2s;
      }
      
      .pip-close-btn:hover {
        background: rgba(255,255,255,0.2);
      }
      
      .pip-participants-grid {
        flex: 1;
        display: grid;
        gap: 2px;
        padding: 4px;
        background: #1a1a1a;
        overflow: hidden;
      }
      
      .pip-participant-tile {
        position: relative;
        background: #2a2a2a;
        border-radius: 8px;
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
        background: #2a2a2a;
      }
      
      .pip-participant-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
        padding: 8px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .pip-participant-tile:hover .pip-participant-overlay {
        opacity: 1;
      }
      
      .pip-participant-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .pip-participant-name {
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .pip-participant-status {
        font-size: 10px;
        opacity: 0.8;
      }
      
      .pip-participant-controls {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      
      .pip-control-btn {
        background: rgba(0,0,0,0.6);
        color: white;
        border: none;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: background 0.2s;
      }
      
      .pip-control-btn:hover {
        background: rgba(255,255,255,0.2);
      }
      
      .pip-control-btn.muted {
        background: rgba(244, 67, 54, 0.8);
      }
      
      .pip-control-btn.video-off {
        background: rgba(244, 67, 54, 0.8);
      }
      
      .pip-audio-only {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: white;
        text-align: center;
        gap: 8px;
      }
      
      .pip-audio-only-icon {
        font-size: 32px;
        opacity: 0.5;
      }
      
      .pip-audio-only-name {
        font-size: 14px;
        font-weight: 500;
      }
      
      .pip-speaking-indicator {
        position: absolute;
        top: 4px;
        left: 4px;
        width: 8px;
        height: 8px;
        background: #4caf50;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      .pip-empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: rgba(255,255,255,0.6);
        text-align: center;
        gap: 16px;
      }
      
      .pip-empty-icon {
        font-size: 48px;
        opacity: 0.3;
      }
    `;
    this.pipWindow.document.head.appendChild(pipStyles);
  }

  // Setup window close handlers
  private setupCloseHandlers(): void {
    if (!this.pipWindow) return;

    const handleClose = () => {
      this.onCloseCallbacks.forEach((callback) => {
        try {
          callback();
        } catch (e) {
          console.warn('Error in close callback:', e);
        }
      });
      this.cleanup();
    };

    this.pipWindow.addEventListener('beforeunload', handleClose);
    this.pipWindow.addEventListener('unload', handleClose);
  }

  // Add close callback
  onClose(callback: () => void): void {
    if (typeof callback === 'function') {
      this.onCloseCallbacks.push(callback);
    }
  }

  // Remove close callback
  offClose(callback: () => void): void {
    this.onCloseCallbacks = this.onCloseCallbacks.filter((cb) => cb !== callback);
  }

  // Render content in PiP window
  renderContent(content: React.ReactElement): void {
    if (!this.pipWindow) return;

    try {
      // Clear existing content
      this.pipWindow.document.body.innerHTML = '';

      // Create root container
      const container = this.pipWindow.document.createElement('div');
      container.id = 'pip-root';
      this.pipWindow.document.body.appendChild(container);

      // Create React root and render content
      this.pipRoot = createRoot(container);
      this.pipRoot.render(content);
    } catch (error) {
      console.error('Error rendering PiP content:', error);
    }
  }

  // Close PiP window
  close(): void {
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.close();
    }
    this.cleanup();
  }

  // Cleanup resources
  private cleanup(): void {
    try {
      if (this.pipRoot) {
        this.pipRoot.unmount();
        this.pipRoot = null;
      }
    } catch (e) {
      console.warn('Error cleaning up PiP root:', e);
    }

    this.pipWindow = null;
    this.onCloseCallbacks = [];
  }
}

// Create singleton instance
const pipManager = new PiPManager();

/**
 * Individual Participant Component for PiP Grid
 */
const PiPParticipant: React.FC<PiPParticipantProps> = ({
  participant,
  mediaStream,
  isSpeaking = false,
  streamName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isLocalUser = participant?.uid === streamName;

  // Set video stream
  useEffect(() => {
    if (videoRef.current && mediaStream && participant?.videoEnabled) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, participant?.videoEnabled]);

  /*
    const handleMuteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMuteToggle?.(participant?.uid);
    };

    const handleVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onVideoToggle?.(participant?.uid);
    };

    const handleVolumeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onVolumeToggle?.(participant?.uid);
    };
    */

  return (
    <Box className="pip-participant-tile">
      {isSpeaking && <Box className="pip-speaking-indicator" />}

      {participant?.videoEnabled && mediaStream ? (
        <video
          ref={videoRef}
          className="pip-participant-video"
          autoPlay
          playsInline
          muted={isLocalUser} // Always mute local user to prevent feedback
        />
      ) : (
        <Box className="pip-audio-only">
          <Box className="pip-audio-only-icon">
            <Avatar
              sx={{
                aspectRatio: '1 / 1',
              }}
              src={defaultAvatar}
            />
          </Box>
          <Box className="pip-audio-only-name">{participant?.name || 'Unknown User'}</Box>
        </Box>
      )}

      <Box className="pip-participant-overlay">
        <Box className="pip-participant-info">
          <Box className="pip-participant-name">
            {participant?.name || 'Unknown User'}
            {isLocalUser && ' (You)'}
          </Box>
          <Box className="pip-participant-status">
            {participant?.videoEnabled ? 'Video On' : 'Audio Only'}
          </Box>
        </Box>

        {/*
                <Box className="pip-participant-controls">
                    <button
                        className={`pip-control-btn ${!participant?.audioEnabled ? 'muted' : ''}`}
                        onClick={handleMuteClick}
                        title={participant?.audioEnabled ? 'Mute' : 'Unmute'}
                    >
                        {participant?.audioEnabled ? '🎤' : '🔇'}
                    </button>

                    <button
                        className={`pip-control-btn ${!participant?.videoEnabled ? 'video-off' : ''}`}
                        onClick={handleVideoClick}
                        title={participant?.videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {participant?.videoEnabled ? '📹' : '📷'}
                    </button>

                    {!isLocalUser && (
                        <button
                            className="pip-control-btn"
                            onClick={handleVolumeClick}
                            title="Toggle volume"
                        >
                            🔊
                        </button>
                    )}
                </Box>
                */}
      </Box>
    </Box>
  );
};

/**
 * PiP Grid Content Component - Shows all participants in a grid
 */
const PiPGridContent: React.FC<PiPGridContentProps> = ({
  participants = [],
  onClose,
  onMuteToggle,
  onVideoToggle,
  onVolumeToggle,
  talkers = [],
  streamName,
}) => {
  // Calculate grid dimensions based on participant count
  const getGridStyle = (count: number): React.CSSProperties => {
    if (count <= 1) return { gridTemplateColumns: '1fr' };
    if (count <= 4) return { gridTemplateColumns: 'repeat(2, 1fr)' };
    if (count <= 9) return { gridTemplateColumns: 'repeat(3, 1fr)' };
    if (count <= 16) return { gridTemplateColumns: 'repeat(4, 1fr)' };
    return { gridTemplateColumns: 'repeat(5, 1fr)' };
  };

  // Get speaking participants
  const speakingIds = talkers?.map((t) => t.streamId) || [];

  return (
    <Box className="pip-container">
      <Box className="pip-header">
        <Box className="pip-title">
          Conference ({participants.length} participant{participants.length !== 1 ? 's' : ''})
        </Box>
        <button className="pip-close-btn" onClick={onClose} title="Close Picture-in-Picture">
          ×
        </button>
      </Box>

      <Box className="pip-participants-grid" style={getGridStyle(participants.length)}>
        {participants.length > 0 ? (
          participants.map((participantData, index) => (
            <PiPParticipant
              key={participantData.participant?.uid || index}
              participant={participantData.participant}
              mediaStream={participantData.mediaStream}
              onMuteToggle={onMuteToggle}
              onVideoToggle={onVideoToggle}
              onVolumeToggle={onVolumeToggle}
              isSpeaking={speakingIds.includes(participantData.participant?.uid)}
              streamName={streamName}
            />
          ))
        ) : (
          <Box className="pip-empty-state">
            <Box className="pip-empty-icon">📹</Box>
            <Box>No participants to display</Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Main PiP Hook for React components
 */
export const usePictureInPicture = (): UsePictureInPictureReturn => {
  const [isSupported] = useState(() => pipManager.isSupported());
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update open state when window changes
  useEffect(() => {
    const checkStatus = () => {
      setIsOpen(pipManager.isOpen());
    };

    const interval = setInterval(checkStatus, 1000);
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, []);

  // Open PiP window with all participants
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
        const errorMsg =
          'Picture-in-Picture is not supported in this browser. Please use Chrome 111+ or Edge 111+';
        setError(errorMsg);
        console.warn(errorMsg);
        return false;
      }

      try {
        setError(null);

        // Open PiP window with dynamic sizing based on participant count
        const participantCount = participants.length;
        let adjustedWidth = width;
        let adjustedHeight = height;

        // Adjust size based on participant count
        if (participantCount <= 4) {
          adjustedWidth = Math.max(600, width);
          adjustedHeight = Math.max(400, height);
        } else if (participantCount <= 9) {
          adjustedWidth = Math.max(800, width);
          adjustedHeight = Math.max(600, height);
        } else {
          adjustedWidth = Math.max(1000, width);
          adjustedHeight = Math.max(700, height);
        }

        await pipManager.openWindow({
          width: adjustedWidth,
          height: adjustedHeight,
          title: `Conference - ${participantCount} participants`,
        });

        // Setup close handler
        const handleClose = () => {
          setIsOpen(false);
        };

        pipManager.onClose(handleClose);

        // Render grid content
        pipManager.renderContent(
          <PiPGridContent
            participants={participants}
            onClose={() => {
              handleClose();
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
        const errorMsg = (err as Error).message || 'Failed to open Picture-in-Picture';
        setError(errorMsg);
        console.error('PiP Error:', err);
        return false;
      }
    },
    [isSupported],
  );

  // Update participants in existing PiP window
  const updatePiP = useCallback(
    ({
      participants = [],
      onMuteToggle,
      onVideoToggle,
      onVolumeToggle,
      talkers = [],
      streamName,
    }: PiPUpdateOptions): void => {
      if (!isOpen || !pipManager.isOpen()) return;

      // Re-render with updated participants
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
    [isOpen],
  );

  // Close PiP window
  const closePiP = useCallback((): void => {
    pipManager.close();
    setIsOpen(false);
    setError(null);
  }, []);

  // Toggle PiP
  const togglePiP = useCallback(
    (options: PiPOpenOptions): Promise<boolean> => {
      if (isOpen) {
        closePiP();
        return Promise.resolve(true);
      } else {
        return openPiP(options);
      }
    },
    [isOpen, openPiP, closePiP],
  );

  return {
    isSupported,
    isOpen,
    error,
    openPiP,
    updatePiP,
    closePiP,
    togglePiP,
  };
};

/**
 * Enhanced PiP Button Component for All Participants View
 */
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

    togglePiP({
      participants,
      onMuteToggle,
      onVideoToggle,
      onVolumeToggle,
      talkers,
      streamName,
    });
  };

  if (!isSupported) {
    return (
      <Tooltip title="Picture-in-Picture not supported in this browser. Please use Chrome 111+ or Edge 111+">
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
          : `Open Picture-in-Picture (${participants.length} participants)`)
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
