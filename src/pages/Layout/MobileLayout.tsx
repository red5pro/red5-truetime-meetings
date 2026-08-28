import React, { useCallback, useMemo } from 'react';
import { Box } from '@mui/system';

import VideoCard from '../../Components/Cards/VideoCard.tsx';
import OthersCard from '../../Components/Cards/OthersCard.tsx';
import {
  calculateConnectionQualityScore,
  isNull,
  isScreenShareParticipant,
} from '../../utils/utils.tsx';
import { LayoutTiledProps, ParticipantObject } from './types.ts';

// Mobile-exclusive layout (see MeetingPage's isMobileLayout gate):
// - 1 local + 1 remote  -> remote fullscreen, local floats as a PIP bubble
// - 1 local + 2 remotes -> remotes stacked, local floats inside the 2nd remote's tile
// - 1 local + 3+ remotes -> everyone in an equal-size grid, 2 tiles per row
//   (beyond 7 remotes, the grid caps out and the rest collapse into an "Others"
//   tile bottom-right; those hidden participants stay mounted off-screen so
//   their audio keeps playing)
const GRID_OVERFLOW_THRESHOLD = 7;
// Capped at an even number so, together with the local tile (1), the pre-Others
// cell count is odd — the Others tile then lands right after it in column 2 of
// the same row instead of leaving a gap or wrapping into a new row's column 1.
const VISIBLE_REMOTES_ON_OVERFLOW = 6;

const LayoutMobile = React.memo<LayoutTiledProps>((props) => {
  const {
    allParticipants = [],
    streamName,
    publishStreamId,
    talkers,
    isPlayOnly,
    pinVideo,
    unpinVideo,
    layout,
  } = props;

  const localParticipant = useMemo(
    () => allParticipants.find((p) => p.participant.uid === streamName),
    [allParticipants, streamName],
  );

  const remoteParticipants = useMemo(
    () => allParticipants.filter((p) => p.participant.uid !== streamName),
    [allParticipants, streamName],
  );

  const handleVideoRef = useCallback(
    (videoElement: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
      if (videoElement && !isNull(mediaStream) && videoElement.srcObject !== mediaStream) {
        videoElement.srcObject = mediaStream;
        videoElement.play().catch(() => {});
      }
    },
    [],
  );

  const renderTile = useCallback(
    (participantObject: ParticipantObject, hidePlayer = false) => {
      const { participant } = participantObject;
      const isMine = participant.uid === streamName;
      const isOwnScreenShare =
        participant.isScreenSharing === true && participant.ownerStreamId === publishStreamId;
      const connectionQualityScore = isMine
        ? (props.networkScore?.outbound ?? 0)
        : (calculateConnectionQualityScore(props.connectionStats?.[participant.uid]) ?? 0);
      const videoId = isMine ? 'red5pro-publisher' : `red5pro-subscriber-${participant.uid}`;

      return (
        <VideoCard
          id={videoId}
          key={videoId}
          isOwnScreenShare={isOwnScreenShare}
          isRaiseHand={participant.isRaiseHand}
          streamId={participant.uid}
          isPending={participant.isPending}
          hidePlayer={hidePlayer}
          autoPlay
          playsInline
          ref={(videoElement: any) => handleVideoRef(videoElement, participantObject.mediaStream)}
          isMine={isMine}
          name={participant.name}
          streamName={streamName}
          isPlayOnly={isPlayOnly}
          isMicMuted={!participant.audioEnabled}
          isCamTurnedOff={!participant.videoEnabled}
          metaData={participant.metaData}
          pinVideo={pinVideo}
          unpinVideo={unpinVideo}
          layout={layout}
          talkers={talkers}
          isScreenShare={isScreenShareParticipant(participant)}
          connectionQuality={connectionQualityScore}
          // @ts-ignore
          setParticipantIdMuted={(participantId: string) =>
            props?.setParticipantIdMuted?.(participantId)
          }
          setMuteParticipantDialogOpen={(isOpen: boolean) =>
            props?.setMuteParticipantDialogOpen?.(isOpen)
          }
        />
      );
    },
    [
      streamName,
      publishStreamId,
      talkers,
      handleVideoRef,
      isPlayOnly,
      pinVideo,
      unpinVideo,
      layout,
      props.networkScore,
      props.connectionStats,
      props.setParticipantIdMuted,
      props.setMuteParticipantDialogOpen,
    ],
  );

  const renderTileContainer = useCallback(
    (participantObject: ParticipantObject, extraClassName = '', overlay?: React.ReactNode) => (
      <Box
        className={`single-video-container not-pinned ${extraClassName}`.trim()}
        key={`mobile-video-${participantObject.participant.uid}`}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          {renderTile(participantObject)}
          {overlay}
        </Box>
      </Box>
    ),
    [renderTile],
  );

  if (!localParticipant) return null;

  // Solo — only the local participant is present.
  if (remoteParticipants.length === 0) {
    return (
      <Box className="mobile-layout-gallery mobile-solo-layout">
        {renderTileContainer(localParticipant)}
      </Box>
    );
  }

  // 1 remote — remote fullscreen, local floats as a PIP bubble.
  if (remoteParticipants.length === 1) {
    const localPip = <Box className="mobile-pip-local">{renderTile(localParticipant)}</Box>;

    return (
      <Box className="mobile-layout-gallery mobile-single-remote-layout">
        {renderTileContainer(remoteParticipants[0], 'mobile-fullscreen-tile', localPip)}
      </Box>
    );
  }

  // 2 remotes — remotes stacked top/bottom, local floats inside the bottom tile.
  if (remoteParticipants.length === 2) {
    const localPip = <Box className="mobile-pip-local">{renderTile(localParticipant)}</Box>;

    return (
      <Box className="mobile-layout-gallery mobile-two-remote-layout">
        {renderTileContainer(remoteParticipants[0], 'mobile-stack-tile')}
        {renderTileContainer(
          remoteParticipants[1],
          'mobile-stack-tile mobile-stack-tile-nested',
          localPip,
        )}
      </Box>
    );
  }

  // 3+ remotes — everyone (including local) in an equal-size grid, 2 tiles per row.
  const hasGridOverflow = remoteParticipants.length > GRID_OVERFLOW_THRESHOLD;
  const visibleRemotes = hasGridOverflow
    ? remoteParticipants.slice(0, VISIBLE_REMOTES_ON_OVERFLOW)
    : remoteParticipants;
  const overflowRemotes = hasGridOverflow
    ? remoteParticipants.slice(VISIBLE_REMOTES_ON_OVERFLOW)
    : [];

  return (
    <>
      <Box className="mobile-layout-gallery mobile-grid-layout">
        {[localParticipant, ...visibleRemotes].map((participantObject) =>
          renderTileContainer(participantObject),
        )}
        {hasGridOverflow && (
          <Box className="single-video-container not-pinned others-tile-wrapper">
            <OthersCard otherParticipantCount={overflowRemotes.length} />
          </Box>
        )}
      </Box>
      {/* Mounted off-screen (see .audio-only-participant) so overflowed participants keep playing audio. */}
      {overflowRemotes.map((participantObject) => (
        <Box
          className="single-video-container audio-only-participant"
          key={`mobile-audio-only-${participantObject.participant.uid}`}
        >
          {renderTile(participantObject, true)}
        </Box>
      ))}
    </>
  );
});

LayoutMobile.displayName = 'LayoutMobile';

export default LayoutMobile;
