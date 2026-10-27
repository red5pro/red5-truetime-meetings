import React, { useCallback, useMemo } from 'react';
import { Box } from '@mui/system';

import VideoCard from '../../Components/Cards/VideoCard.tsx';
import OthersCard from '../../Components/Cards/OthersCard.tsx';
import {
  calculateConnectionQualityScore,
  isNull,
  isScreenShareParticipant,
} from '../../utils/utils.tsx';
import { LayoutOptions } from '../../utils/layoutOptions.ts';
import { LayoutMobileProps, ParticipantObject } from './types.ts';

// Mobile-exclusive layout (see MeetingPage's isMobileLayout gate):
// - Pinned participant (any layout) -> pinned tile alone on the first row,
//   everyone else in the 2-per-row grid below it
// - Tiled -> everyone in an equal-size grid, 2 tiles per row
// - Auto:
//   - 1 local + 1 remote  -> remote fullscreen, local floats as a PIP bubble
//   - 1 local + 2 remotes -> remotes stacked, local floats inside the 2nd remote's tile
//   - 1 local + 3+ remotes -> same grid as Tiled
// In the grid, beyond 8 tiles (local + 7 remotes) the grid caps out and the rest
// collapse into an "Others" tile bottom-right; those hidden participants stay
// mounted off-screen so their audio keeps playing.
const GRID_OVERFLOW_THRESHOLD = 8;
// Capped at an odd number so the Others tile lands right after the last visible
// tile in column 2 of the same row instead of leaving a gap or wrapping into a
// new row's column 1.
const VISIBLE_TILES_ON_OVERFLOW = 7;

const LayoutMobile = React.memo<LayoutMobileProps>((props) => {
  const {
    allParticipants = [],
    streamName,
    publishStreamId,
    talkers,
    isPlayOnly,
    pinnedParticipantId,
    pinVideo,
    unpinVideo,
    layout,
    networkScore,
    connectionStats,
    setParticipantIdMuted,
    setMuteParticipantDialogOpen,
  } = props;

  const localParticipant = useMemo(
    () => allParticipants.find((p) => p.participant.uid === streamName),
    [allParticipants, streamName],
  );

  const remoteParticipants = useMemo(
    () => allParticipants.filter((p) => p.participant.uid !== streamName),
    [allParticipants, streamName],
  );

  const pinnedParticipant = useMemo(
    () =>
      pinnedParticipantId
        ? allParticipants.find((p) => p.participant.uid === pinnedParticipantId)
        : undefined,
    [allParticipants, pinnedParticipantId],
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
    (participantObject: ParticipantObject, hidePlayer = false, pinned = false) => {
      const { participant } = participantObject;
      const isMine = participant.uid === streamName;
      const isOwnScreenShare =
        participant.isScreenSharing === true && participant.ownerStreamId === publishStreamId;
      const connectionQualityScore = isMine
        ? (networkScore?.outbound ?? 0)
        : (calculateConnectionQualityScore(connectionStats?.[participant.uid]) ?? 0);
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
          pinned={pinned}
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
          // @ts-expect-error - callback param type mismatch with legacy types
          setParticipantIdMuted={(participantId: string) => setParticipantIdMuted?.(participantId)}
          setMuteParticipantDialogOpen={(isOpen: boolean) => setMuteParticipantDialogOpen?.(isOpen)}
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
      networkScore,
      connectionStats,
      setParticipantIdMuted,
      setMuteParticipantDialogOpen,
    ],
  );

  const renderTileContainer = useCallback(
    (
      participantObject: ParticipantObject,
      extraClassName = '',
      overlay?: React.ReactNode,
      pinned = false,
    ) => (
      <Box
        className={`single-video-container ${pinned ? 'mobile-pinned-tile' : 'not-pinned'} ${extraClassName}`.trim()}
        key={`mobile-video-${participantObject.participant.uid}`}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          {renderTile(participantObject, false, pinned)}
          {overlay}
        </Box>
      </Box>
    ),
    [renderTile],
  );

  // Equal-size grid, 2 tiles per row; an optional pinned tile spans the whole first row.
  const renderGrid = (tiles: ParticipantObject[], pinned?: ParticipantObject) => {
    const hasGridOverflow = tiles.length > GRID_OVERFLOW_THRESHOLD;
    const visibleTiles = hasGridOverflow ? tiles.slice(0, VISIBLE_TILES_ON_OVERFLOW) : tiles;
    const overflowTiles = hasGridOverflow ? tiles.slice(VISIBLE_TILES_ON_OVERFLOW) : [];

    return (
      <>
        <Box className="mobile-layout-gallery mobile-grid-layout">
          {pinned && renderTileContainer(pinned, '', undefined, true)}
          {visibleTiles.map((participantObject) => renderTileContainer(participantObject))}
          {hasGridOverflow && (
            <Box className="single-video-container not-pinned others-tile-wrapper">
              <OthersCard otherParticipantCount={overflowTiles.length} />
            </Box>
          )}
        </Box>
        {/* Mounted off-screen (see .audio-only-participant) so overflowed participants keep playing audio. */}
        {overflowTiles.map((participantObject) => (
          <Box
            className="single-video-container audio-only-participant"
            key={`mobile-audio-only-${participantObject.participant.uid}`}
          >
            {renderTile(participantObject, true)}
          </Box>
        ))}
      </>
    );
  };

  if (!localParticipant) return null;

  // Pinned — pinned tile alone on the first row, everyone else in the grid below.
  if (pinnedParticipant) {
    const unpinned = [localParticipant, ...remoteParticipants].filter(
      (p) => p !== pinnedParticipant,
    );
    return renderGrid(unpinned, pinnedParticipant);
  }

  // Solo — only the local participant is present.
  if (remoteParticipants.length === 0) {
    return (
      <Box className="mobile-layout-gallery mobile-solo-layout">
        {renderTileContainer(localParticipant)}
      </Box>
    );
  }

  // Tiled — always the plain grid, no floating self-view.
  if (layout === LayoutOptions.Tiled) {
    return renderGrid([localParticipant, ...remoteParticipants]);
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
  return renderGrid([localParticipant, ...remoteParticipants]);
});

LayoutMobile.displayName = 'LayoutMobile';

export default LayoutMobile;
