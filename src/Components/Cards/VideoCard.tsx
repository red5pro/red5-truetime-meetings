import React, { useState, useCallback, useMemo, VideoHTMLAttributes } from 'react';
import { alpha, styled } from '@mui/material/styles';
import { Typography, useTheme, Box, Tooltip, Theme, Slider } from '@mui/material';
import Grid from '@mui/material/Grid2';
import VolumeUp from '@mui/icons-material/VolumeUp';
import { useTranslation } from 'react-i18next';
import { isMobile, isTablet } from 'react-device-detect';

import DummyCard from './DummyCard';
import CustomCard from '../CustomCard.tsx';
import { CustomizedBtn, roundStyle } from '../CustomizedBtn.tsx';
import { SvgIcon } from '../SvgIcon';
import { LayoutOptions } from '../../utils/layoutOptions.ts';
import CustomSpinner from '../CustomSpinner.tsx';
import { ConnectionQualityBar } from '../ConnectionQualityBar.tsx';
import TalkingIndicator from '../TalkingIndicator.tsx';

// Types and Interfaces
interface Participant {
  streamId: string;
  streamName: string;
}

interface Talker {
  streamId: string;
  audioLevel?: number;
}

interface OverlayButtonProps {
  title: string;
  icon: string;
  color: 'primary' | 'secondary' | 'error';
  onClick: () => void;
}

interface ModerationButtonsProps {
  micMuted: boolean;
  streamId: string;
  name: string;
  setParticipantIdMuted: (participant: Participant) => void;
  setMuteParticipantDialogOpen: (open: boolean) => void;
}

interface PinButtonProps {
  pinned: boolean;
  name: string;
  pinVideo: (streamId: string) => void;
  unpinVideo: (force?: boolean) => void;
  streamId: string;
}

interface ParticipantStatusProps {
  isMicMuted: boolean;
  streamId: string;
}

interface VideoTitleProps {
  name?: string;
  isRaiseHand?: boolean;
}

interface VideoPlayerProps {
  isMine: boolean;
  isCamTurnedOff: boolean;
  streamId: string;
  hidePlayer: boolean;
  isPending: boolean;
  videoProps: VideoHTMLAttributes<HTMLVideoElement>;
}

interface OverlayButtonsProps {
  isMine: boolean;
  displayHover: boolean;
  hidePin: boolean;
  pinned: boolean;
  layout: string;
  streamId: string;
  name: string;
  micMuted: boolean;
  setParticipantIdMuted: (participant: Participant) => void;
  setMuteParticipantDialogOpen: (open: boolean) => void;
  pinVideo: (streamId: string) => void;
  unpinVideo: (force?: boolean) => void;
  metaData?: string;
}

interface VideoCardProps extends VideoHTMLAttributes<HTMLVideoElement> {
  isMine: boolean;
  isCamTurnedOff: boolean;
  streamId: string;
  hidePlayer?: boolean;
  hidePin?: boolean;
  isPending?: boolean;
  isMobileView?: boolean;
  isMicMuted: boolean;
  name?: string;
  isRaiseHand?: boolean;
  pinned?: boolean;
  layout: string;
  pinVideo: (streamId: string) => void;
  unpinVideo: (force?: boolean) => void;
  isOwnScreenShare?: boolean;
  setParticipantIdMuted: (participant: Participant) => void;
  setMuteParticipantDialogOpen: (open: boolean) => void;
  connectionQuality?: number;
  talkers?: Talker[];
  metaData?: string;
}

// Styled components
const CustomizedVideo = styled('video')({
  borderRadius: 4,
  width: '100%',
  height: '100%',
  objectPosition: 'center',
  backgroundColor: 'transparent',
});

const CustomizedBox = styled(Box)(({ theme }: { theme: Theme }) => ({
  backgroundColor: alpha(theme.palette.gray[90], 0.3),
}));

const ScreenShareOverlay = styled(Box)(({ theme }: { theme: Theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: alpha(theme.palette.common.black, 0.75),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 200,
  borderRadius: 4,
  padding: theme.spacing(2),
  textAlign: 'center',
  backdropFilter: 'blur(4px)',
}));

const LoadingContainer = styled(Box)(({}: { theme: Theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  width: '100%',
  backgroundColor: '#262626',
  borderRadius: 4,
}));

// Constants
const CARD_BUTTON_STYLE = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: { xs: '6vw', md: 32 },
  height: { xs: '6vw', md: 32 },
  borderRadius: '50%',
  position: 'relative',
};

const OVERLAY_STYLE = {
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  zIndex: 100,
  transition: 'opacity 0.3s ease',
};

const NAME_INDICATOR_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'white',
  backgroundColor: '#262626',
  borderRadius: '21px',
  padding: '4px 12px',
  width: 'fit-content',
};

const ModerationButtons: React.FC<ModerationButtonsProps> = ({
  micMuted,
  streamId,
  name,
  setParticipantIdMuted,
  setMuteParticipantDialogOpen,
}) => {
  const handleToggleMic = () => {
    if (micMuted) {
      return;
    }

    const participant: Participant = {
      streamId: streamId,
      streamName: name,
    };

    setParticipantIdMuted(participant);
    setMuteParticipantDialogOpen(true);
  };

  return (
    <OverlayButton
      title={`Microphone ${micMuted ? 'on' : 'off'} ${name}`}
      icon={micMuted ? 'muted-microphone' : 'microphone'}
      color={micMuted ? 'error' : 'primary'}
      onClick={handleToggleMic}
    />
  );
};

// Sub-components
const OverlayButton = React.memo<OverlayButtonProps>(({ title, icon, color, onClick }) => {
  const theme = useTheme();

  return (
    <Tooltip title={title} placement="top" style={{ margin: '2px' }}>
      <CustomizedBtn
        id="overlay-button"
        glass={false}
        className="footer-icon-button"
        variant="contained"
        color={color}
        sx={roundStyle}
        onClick={onClick}
      >
        <SvgIcon
          size={24}
          viewBox="0 0 500 500"
          name={icon}
          color={theme.palette?.iconColor?.primary}
        />
      </CustomizedBtn>
    </Tooltip>
  );
});

const PinButton = React.memo<PinButtonProps>(({ pinned, name, pinVideo, unpinVideo, streamId }) => {
  const { t } = useTranslation();

  const buttonConfig = useMemo(
    () => ({
      title: `${pinned ? t('unpin') : t('pin')} ${name}`,
      icon: pinned ? 'unpin' : 'pin',
    }),
    [pinned, name, t],
  );

  const handleClick = useCallback(() => {
    pinned ? unpinVideo(true) : pinVideo(streamId);
  }, [pinned, unpinVideo, pinVideo, streamId]);

  return (
    <OverlayButton
      title={buttonConfig.title}
      icon={buttonConfig.icon}
      color="secondary"
      onClick={handleClick}
    />
  );
});

const ParticipantStatus = React.memo<ParticipantStatusProps>(({ isMicMuted, streamId }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!isMicMuted) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: { xs: 8, md: 16 },
        right: { xs: 8, md: 16 },
        zIndex: 9,
      }}
    >
      <Tooltip title={t('mic is muted')} placement="top">
        <CustomizedBox id={`mic-muted-${streamId}`} sx={CARD_BUTTON_STYLE}>
          <SvgIcon
            size={16}
            viewBox="0 0 500 500"
            name="muted-microphone"
            color={theme.palette?.iconColor?.primary}
          />
        </CustomizedBox>
      </Tooltip>
    </Box>
  );
});

const VideoTitle = React.memo<VideoTitleProps>(({ name, isRaiseHand }) => {
  if (!name) return null;

  if (isRaiseHand) {
    return (
      <Box className="name-indicator">
        <Typography color="#fff" align="left" className="name">
          <Box component="span" style={NAME_INDICATOR_STYLE}>
            🖐🏻 {name}
          </Box>
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="name-indicator">
      <Typography color="#fff" align="left" className="name">
        {name}
      </Typography>
    </Box>
  );
});

const VideoPlayer = React.memo<VideoPlayerProps>(
  ({ isMine, isCamTurnedOff, streamId, hidePlayer, isPending, videoProps }) => {
    const videoStyle = useMemo(() => {
      if (hidePlayer) {
        return {
          visibility: 'hidden' as const,
          width: '1px',
          height: '1px',
        };
      }

      return {
        // @ts-ignore
        visibility: (isCamTurnedOff ? 'hidden' : 'visible') as const,
        objectFit: 'contain' as const,
      };
    }, [hidePlayer, isCamTurnedOff]);

    const containerStyle = useMemo(
      () => ({
        height: '100%',
        transform: isMine && !isCamTurnedOff ? 'rotateY(180deg)' : 'none',
      }),
      [isMine, isCamTurnedOff],
    );

    return (
      <Grid container style={containerStyle}>
        {isPending ? (
          <LoadingContainer>
            Connecting
            <CustomSpinner type="dots" size={40} color="white" thickness={4} />
          </LoadingContainer>
        ) : (
          <DummyCard streamName={streamId} isVisible={isCamTurnedOff} />
        )}
        <CustomCard>
          <CustomizedVideo {...videoProps} playsInline muted={isMine} style={videoStyle} />
        </CustomCard>
      </Grid>
    );
  },
);

const ScreenShareWarning = React.memo(() => {
  return (
    <ScreenShareOverlay>
      <Typography variant="h6" color="white" gutterBottom sx={{ fontWeight: 'bold' }}>
        You are presenting
      </Typography>
      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
        To avoid an infinite mirror, don't share your entire screen or browser instead.
      </Typography>
    </ScreenShareOverlay>
  );
});

const OverlayButtons = React.memo<OverlayButtonsProps>(
  ({
    isMine,
    displayHover,
    hidePin,
    pinned,
    layout,
    streamId,
    name,
    micMuted,
    setParticipantIdMuted,
    setMuteParticipantDialogOpen,
    pinVideo,
    unpinVideo,
    metaData,
  }) => {
    if (hidePin) return null;

    const shouldShowPinButton =
      !isMobile && !isTablet && !(pinned && layout === LayoutOptions.Sidebar);

    const isExternalStream = metaData === 'external-stream';
    const [volume, setVolume] = useState<number>(1);

    const handleVolumeChange = useCallback(
      (_: Event, newValue: number | number[]) => {
        const val = newValue as number;
        setVolume(val);
        const videoId = isMine ? 'red5pro-publisher' : `red5pro-subscriber-${streamId}`;
        const videoEl = document.getElementById(videoId) as HTMLVideoElement;
        if (videoEl) {
          videoEl.volume = val;
          videoEl.muted = val === 0;
        }
      },
      [isMine, streamId],
    );

    return (
      <Box
        className="pin-overlay"
        sx={{
          ...OVERLAY_STYLE,
          opacity: displayHover ? 1 : 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {shouldShowPinButton && (
            <PinButton
              name={name}
              pinVideo={pinVideo}
              unpinVideo={unpinVideo}
              streamId={streamId}
              pinned={pinned}
            />
          )}
          {!isMine && !isExternalStream && (
            <ModerationButtons
              name={name}
              streamId={streamId}
              micMuted={micMuted}
              setParticipantIdMuted={setParticipantIdMuted}
              setMuteParticipantDialogOpen={setMuteParticipantDialogOpen}
            />
          )}
          {!isMine && isExternalStream && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                ml: 1,
                width: 100,
                pointerEvents: 'auto',
              }}
            >
              <VolumeUp sx={{ color: 'white', mr: 1 }} fontSize="small" />
              <Slider
                size="small"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                sx={{ color: 'white' }}
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  },
);

// Main component
const VideoCard = React.memo<VideoCardProps>((props) => {
  const {
    isMine,
    isCamTurnedOff,
    streamId,
    hidePlayer = false,
    hidePin = false,
    isPending = false,
    isMobileView = false,
    isMicMuted,
    name,
    isRaiseHand = false,
    pinned = false,
    layout,
    pinVideo,
    unpinVideo,
    isOwnScreenShare = false,
    setParticipantIdMuted,
    setMuteParticipantDialogOpen,
    connectionQuality = 0,
    talkers = [],
    metaData,
    ...videoProps
  } = props;
  const theme = useTheme();

  const [displayHover, setDisplayHover] = useState(false);

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setDisplayHover(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDisplayHover(false);
  }, []);

  // Memoized styles
  const cardStyle = useMemo(
    () => ({
      height: isMobileView ? '40%' : '100%',
      width: isMobileView ? '20%' : '100%',
      position: 'relative' as const,
      borderRadius: 4,
      overflow: 'hidden' as const,
    }),
    [isMobileView],
  );

  const containerStyle = useMemo(
    () => ({
      height: '100%',
      width: '100%',
      position: 'relative' as const,
      visibility: 'visible' as const,
    }),
    [],
  );

  // Early return for hidden player
  if (hidePlayer) {
    return (
      <CustomizedVideo
        {...videoProps}
        playsInline
        muted={isMine}
        style={{
          visibility: 'hidden',
          width: '1px',
          height: '1px',
        }}
      />
    );
  }

  return (
    <Grid
      container
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <OverlayButtons
        isMine={isMine}
        displayHover={displayHover}
        hidePin={hidePin}
        pinned={pinned}
        layout={layout}
        name={name ?? ''}
        pinVideo={pinVideo}
        unpinVideo={unpinVideo}
        streamId={streamId}
        micMuted={isMicMuted}
        setParticipantIdMuted={setParticipantIdMuted}
        setMuteParticipantDialogOpen={setMuteParticipantDialogOpen}
        metaData={metaData}
      />

      <Box className="single-video-card" id={`card-${streamId || ''}`} style={cardStyle}>
        {/*@ts-ignore*/}
        <TalkingIndicator streamId={streamId} talkers={talkers} />

        <VideoPlayer
          isMine={isMine}
          isCamTurnedOff={isCamTurnedOff}
          streamId={streamId}
          hidePlayer={hidePlayer}
          isPending={isPending}
          videoProps={videoProps}
        />

        <ParticipantStatus isMicMuted={isMicMuted} streamId={streamId} />

        <VideoTitle name={name} isRaiseHand={isRaiseHand} />

        {connectionQuality > 0 && !hidePlayer && (
          <ConnectionQualityBar
            streamId={streamId}
            isMine={isMine}
            connectionQuality={connectionQuality}
            theme={theme}
          />
        )}

        {isOwnScreenShare && <ScreenShareWarning />}
      </Box>
    </Grid>
  );
});

// Display names for debugging
OverlayButton.displayName = 'OverlayButton';
PinButton.displayName = 'PinButton';
ParticipantStatus.displayName = 'ParticipantStatus';
VideoTitle.displayName = 'VideoTitle';
VideoPlayer.displayName = 'VideoPlayer';
ScreenShareWarning.displayName = 'ScreenShareWarning';
OverlayButtons.displayName = 'OverlayButtons';
VideoCard.displayName = 'VideoCard';

export default VideoCard;
