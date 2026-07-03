import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box } from '@mui/system';

import VideoCard from '../../Components/Cards/VideoCard.tsx';
import OthersCard from '../../Components/Cards/OthersCard.tsx';
import { calculateConnectionQualityScore, isNull } from '../../utils/utils.tsx';
import { CardDimensions, LayoutConfig, LayoutTiledProps, ParticipantObject } from './types.ts';
import { calculateOptimalLayout } from './utils.ts';

// Constants
const DEFAULT_ASPECT_RATIO = 16 / 9;
const CARD_MARGIN = 8;
const LAYOUT_BUFFER = 2; // Extra count to prevent single video filling entire page
const FOOTER_HEIGHT = 80;

const getInitialCardDimensions = (): CardDimensions => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  const availableWidth = Math.max(window.innerWidth - 32, 0);
  const availableHeight = Math.max(window.innerHeight - FOOTER_HEIGHT - 32, 0);
  const width = Math.min(availableWidth, 480);
  const height = Math.min(
    width / DEFAULT_ASPECT_RATIO,
    availableHeight || width / DEFAULT_ASPECT_RATIO,
  );

  return {
    width: Math.max(width, 0),
    height: Math.max(height, 0),
  };
};

const LayoutTiled = React.memo<LayoutTiledProps>((props) => {
  const {
    allParticipants = [],
    width = 800,
    height = 600,
    streamName,
    publishStreamId,
    currentConferenceClient,
    talkers,
    isPlayOnly,
    pinVideo,
    unpinVideo,
    layout,
    globals,
  } = props;

  // State for card dimensions
  const [cardDimensions, setCardDimensions] = useState<CardDimensions>(getInitialCardDimensions);

  // Memoized calculations
  const layoutConfig = useMemo<LayoutConfig>(() => {
    const videoCount = allParticipants.length + LAYOUT_BUFFER;
    const showOthers =
      allParticipants.length > (globals?.desiredTileCount || allParticipants.length);

    return {
      videoCount,
      showOthers,
      aspectRatio: DEFAULT_ASPECT_RATIO,
    };
  }, [allParticipants.length, globals?.desiredTileCount]);

  // Memoized visible participants
  const visibleParticipants = useMemo(() => {
    const tileCount = globals?.desiredTileCount || allParticipants.length;
    return allParticipants.slice(0, tileCount);
  }, [allParticipants, globals?.desiredTileCount]);

  // Calculate and update card dimensions
  useEffect(() => {
    if (!width || !height) return;

    const layout = calculateOptimalLayout(
      width,
      height,
      layoutConfig.videoCount,
      layoutConfig.aspectRatio,
    );

    setCardDimensions({
      width: Math.max(0, layout.width - CARD_MARGIN),
      height: Math.max(0, layout.height - CARD_MARGIN),
    });
  }, [width, height, layoutConfig.videoCount, layoutConfig.aspectRatio]);

  // Video ref handler
  const handleVideoRef = useCallback(
    (videoElement: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
      if (videoElement && !isNull(mediaStream) && videoElement.srcObject !== mediaStream) {
        videoElement.srcObject = mediaStream;
        videoElement.play().catch(() => {});
      }
    },
    [],
  );

  // Render individual video card
  const renderVideoCard = useCallback(
    (participantObject: ParticipantObject, _index: number) => {
      const { participant } = participantObject;
      const isOwnScreenShare =
        participant.isScreenSharing === true && participant.ownerStreamId === publishStreamId;
      const isMine = participant.uid === streamName;

      const connectionQualityScore = isMine
        ? (props.networkScore?.outbound ?? 0)
        : (calculateConnectionQualityScore(props.connectionStats?.[participant.uid]) ?? 0);

      const videoId = isMine ? 'red5pro-publisher' : `red5pro-subscriber-${participant.uid}`;

      const containerStyle = {
        width: `${cardDimensions.width}px`,
        height: `${cardDimensions.height}px`,
        maxWidth: '100%',
      };

      return (
        <Box
          className="single-video-container not-pinned"
          key={`video-${participant.uid}`}
          sx={containerStyle}
        >
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <VideoCard
              id={videoId}
              key={videoId}
              isOwnScreenShare={isOwnScreenShare}
              isRaiseHand={participant.isRaiseHand}
              streamId={participant.uid}
              isPending={participant.isPending}
              autoPlay
              playsInline
              ref={(videoElement: any) =>
                handleVideoRef(videoElement, participantObject.mediaStream)
              }
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
              // @ts-ignore
              talkers={talkers}
              connectionQuality={connectionQualityScore}
              // @ts-ignore
              setParticipantIdMuted={(participantId: string) =>
                props?.setParticipantIdMuted?.(participantId)
              }
              setMuteParticipantDialogOpen={(isOpen: boolean) =>
                props?.setMuteParticipantDialogOpen?.(isOpen)
              }
            />
          </Box>
        </Box>
      );
    },
    [
      cardDimensions,
      streamName,
      publishStreamId,
      currentConferenceClient,
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

  // Render all video cards
  const renderVideoCards = useCallback(() => {
    return visibleParticipants.map(renderVideoCard);
  }, [visibleParticipants, renderVideoCard]);

  // Render others card
  const renderOthersCard = useCallback(() => {
    if (!layoutConfig.showOthers) return null;

    const othersCount =
      allParticipants.length - (globals?.desiredTileCount || allParticipants.length);

    const containerStyle = {
      width: `${cardDimensions.width}px`,
      height: `${cardDimensions.height}px`,
      maxWidth: `${cardDimensions.width}px`,
    };

    return (
      <Box className="single-video-container not-pinned others-tile-wrapper" sx={containerStyle}>
        <OthersCard otherParticipantCount={Math.max(0, othersCount)} />
      </Box>
    );
  }, [layoutConfig.showOthers, cardDimensions, allParticipants.length, globals?.desiredTileCount]);

  return (
    <>
      {renderVideoCards()}
      {renderOthersCard()}
    </>
  );
});

LayoutTiled.displayName = 'LayoutTiled';

export default LayoutTiled;
