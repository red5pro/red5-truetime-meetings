import React, { useCallback, useState, VideoHTMLAttributes } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { MicOutlined, PanTool, PushPin, PushPinOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  Spinner,
  StatusBadge,
  ToolbarButton,
  VideoTile,
  VolumeControl,
  readableOn,
  themeColors,
} from 'truetime-ui';

import { ConnectionQualityBar } from '../ConnectionQualityBar.tsx';

interface Participant {
  streamId: string;
  streamName: string;
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
  talkers?: string[];
  metaData?: string;
  isScreenShare?: boolean;
  /** Show the name chip; off where the page shows the name itself (the lobby preview). */
  showName?: boolean;
}

/** Props some layouts still pass from the old tile; they mean nothing to a <video>. */
const LEGACY_PROPS = [
  'layout',
  'isMobileView',
  'streamName',
  'isPlayOnly',
  'isPublished',
  'publishStreamId',
  'turnOffYourMicNotification',
] as const;

interface TileActionsProps {
  isMine: boolean;
  pinned: boolean;
  streamId: string;
  name: string;
  micMuted: boolean;
  isExternalStream: boolean;
  videoId?: string;
  pinVideo: (streamId: string) => void;
  unpinVideo: (force?: boolean) => void;
  setParticipantIdMuted: (participant: Participant) => void;
  setMuteParticipantDialogOpen: (open: boolean) => void;
}

/** Pin, mute and volume, revealed by the tile on hover or keyboard focus (always on touch). */
const TileActions = React.memo<TileActionsProps>(
  ({
    isMine,
    pinned,
    streamId,
    name,
    micMuted,
    isExternalStream,
    videoId,
    pinVideo,
    unpinVideo,
    setParticipantIdMuted,
    setMuteParticipantDialogOpen,
  }) => {
    const { t } = useTranslation();
    const [volume, setVolume] = useState(1);

    const handleVolume = useCallback(
      (value: number) => {
        setVolume(value);
        // The SDK owns the element; it is found by the id the layout gave it
        const video = videoId
          ? (document.getElementById(videoId) as HTMLVideoElement | null)
          : null;
        if (video) {
          video.volume = value;
          video.muted = value === 0;
        }
      },
      [videoId],
    );

    const handleMute = useCallback(() => {
      setParticipantIdMuted({ streamId, streamName: name });
      setMuteParticipantDialogOpen(true);
    }, [streamId, name, setParticipantIdMuted, setMuteParticipantDialogOpen]);

    return (
      <>
        <ToolbarButton
          id={`pin-${streamId}`}
          // A toggle keeps one name and reports its state; the tooltip says what a press does
          label={t('Pin {{name}}', { name })}
          pressed={pinned}
          tooltip={pinned ? t('Unpin {{name}}', { name }) : t('Pin {{name}}', { name })}
          icon={pinned ? <PushPin /> : <PushPinOutlined />}
          onClick={() => (pinned ? unpinVideo() : pinVideo(streamId))}
        />
        {/* Hosts can ask someone to mute; there's nothing to do once they already are */}
        {!isMine && !isExternalStream && !micMuted && (
          <ToolbarButton
            id={`mute-${streamId}`}
            label={t('Mute {{name}}', { name })}
            icon={<MicOutlined />}
            onClick={handleMute}
          />
        )}
        {!isMine && isExternalStream && (
          <VolumeControl value={volume} onChange={handleVolume} label={name} sx={{ width: 140 }} />
        )}
      </>
    );
  },
);

/** Shown on your own screen-share tile, so you don't share the meeting into itself. */
const ScreenShareWarning = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={(theme) => ({
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        p: 2,
        textAlign: 'center',
        backgroundColor: alpha(themeColors(theme).monitor, 0.75),
      })}
    >
      <Typography variant="h6" component="p">
        {t('You are presenting')}
      </Typography>
      <Typography variant="body2" sx={{ maxWidth: '40ch' }}>
        {t("To avoid an infinite mirror, don't share your entire screen or browser.")}
      </Typography>
    </Box>
  );
};

/** One participant in the meeting grid: the SDK's video on a truetime-ui VideoTile. */
const VideoCard = React.memo<VideoCardProps>((props) => {
  const {
    isMine,
    isCamTurnedOff,
    streamId,
    hidePlayer = false,
    hidePin = false,
    isPending = false,
    isMicMuted,
    name = '',
    isRaiseHand = false,
    pinned = false,
    pinVideo,
    unpinVideo,
    isOwnScreenShare = false,
    setParticipantIdMuted,
    setMuteParticipantDialogOpen,
    connectionQuality = 0,
    talkers = [],
    metaData,
    isScreenShare = false,
    showName = true,
    ...rest
  } = props;
  const videoProps = { ...rest } as VideoHTMLAttributes<HTMLVideoElement> & Record<string, unknown>;
  for (const key of LEGACY_PROPS) delete videoProps[key];
  const theme = useTheme();
  const { t } = useTranslation();

  // A video element the layout still needs (e.g. your own screen share), with no tile around it
  if (hidePlayer) {
    return (
      <video
        {...videoProps}
        playsInline
        muted={isMine}
        style={{ visibility: 'hidden', width: 1, height: 1 }}
      />
    );
  }

  // Exact match only: a screen share publishes under an id derived from its owner's, and it
  // carries no speaker of its own
  const isTalking = !isScreenShare && !!streamId && talkers.includes(streamId);

  return (
    <Box
      id={`card-${streamId}`}
      // Focusable by tap (not by Tab), so touching a tile reveals its actions
      tabIndex={hidePin ? undefined : -1}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        '&:focus': { outline: 'none' },
        // VideoTile keeps actions visible on touch screens; in a meeting that would dim every
        // face, so on touch they appear when the tile is tapped. Hidden actions don't take taps.
        '@media (hover: none)': {
          '&& [data-tile-actions]': { opacity: 0, pointerEvents: 'none' },
          '&&:focus-within [data-tile-actions]': { opacity: 1, pointerEvents: 'auto' },
        },
      }}
    >
      <VideoTile
        fill
        name={name}
        showName={showName}
        media={<video {...videoProps} playsInline muted={isMine} />}
        videoEnabled={!isCamTurnedOff && !isPending}
        audioEnabled={!isMicMuted}
        // Your own camera is mirrored and fills its tile; others keep their whole frame
        mirrored={isMine && !isScreenShare}
        fit={isMine ? 'cover' : 'contain'}
        highlighted={isTalking}
        avatar={
          isPending ? (
            <Spinner
              type="dots"
              size={32}
              color={themeColors(theme).text}
              label={t('Connecting')}
            />
          ) : undefined
        }
        status={
          isRaiseHand ? (
            <StatusBadge
              tone="warning"
              // Solid, so it reads over any picture (the tinted badge is for flat surfaces)
              sx={{
                backgroundColor: themeColors(theme).warning,
                color: readableOn(
                  themeColors(theme).warning,
                  theme.palette.themeColor[90],
                  themeColors(theme).text,
                ),
              }}
            >
              <PanTool aria-hidden sx={{ fontSize: 14 }} />
              {t('Hand raised')}
            </StatusBadge>
          ) : undefined
        }
        actions={
          hidePin ? undefined : (
            <TileActions
              isMine={isMine}
              pinned={pinned}
              streamId={streamId}
              name={name}
              micMuted={isMicMuted}
              isExternalStream={metaData === 'external-stream'}
              videoId={videoProps.id}
              pinVideo={pinVideo}
              unpinVideo={unpinVideo}
              setParticipantIdMuted={setParticipantIdMuted}
              setMuteParticipantDialogOpen={setMuteParticipantDialogOpen}
            />
          )
        }
      />

      {connectionQuality > 0 && (
        <ConnectionQualityBar
          streamId={streamId}
          isMine={isMine}
          connectionQuality={connectionQuality}
          theme={theme}
        />
      )}

      {isOwnScreenShare && <ScreenShareWarning />}
    </Box>
  );
});

TileActions.displayName = 'TileActions';
VideoCard.displayName = 'VideoCard';

export default VideoCard;
