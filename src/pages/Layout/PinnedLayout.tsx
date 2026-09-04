import React, { useMemo, useCallback } from 'react';
import { Box } from '@mui/system';
import useMediaQuery from '@mui/material/useMediaQuery';

import VideoCard from '../../Components/Cards/VideoCard.tsx';
import OthersCard from '../../Components/Cards/OthersCard.tsx';
import {
  calculateConnectionQualityScore,
  isNull,
  isScreenShareParticipant,
} from '../../utils/utils.tsx';
import { useSpeakerOrder } from '../../hooks/useSpeakerOrder.ts';
import {
  LayoutPinnedProps,
  ParticipantCounts,
  ParticipantGroups,
  ParticipantObject,
  PinnedParticipantData,
} from './types.ts';

// Constants
const MAX_VIDEO_AT_SIDE = 3;

const LayoutPinned = React.memo<LayoutPinnedProps>((props) => {
  const {
    allParticipants = [],
    pinnedParticipantId,
    publishStreamId,
    streamName,
    talkers,
    isPlayOnly,
    pinVideo,
    unpinVideo,
    layout,
    currentConferenceClient,
    isMobile,
  } = props;

  const isMobileViewport = useMediaQuery('(max-width:600px)');
  const isMobileLayout = isMobile ?? isMobileViewport;

  // Memoized calculations
  const participantCounts = useMemo<ParticipantCounts>(() => {
    const totalParticipants = allParticipants.length;
    const maxPlayingParticipants = Math.min(totalParticipants, MAX_VIDEO_AT_SIDE);
    const othersCount = totalParticipants - Math.min(totalParticipants, MAX_VIDEO_AT_SIDE) - 1;
    const showOthers = othersCount > 0 || totalParticipants === 1;

    return {
      maxPlayingParticipants,
      othersCount,
      showOthers,
    };
  }, [allParticipants.length]);

  // Memoized pinned participant data
  const pinnedParticipantData = useMemo<PinnedParticipantData | null>(() => {
    if (!pinnedParticipantId) return null;

    const pinnedParticipant = allParticipants.find(
      (p) => p.participant.uid === pinnedParticipantId,
    );

    if (!pinnedParticipant) return null;

    const isMine = pinnedParticipantId === streamName;

    return {
      participant: pinnedParticipant.participant,
      mediaStream: pinnedParticipant.mediaStream,
      isMine,
    };
  }, [pinnedParticipantId, allParticipants, streamName, currentConferenceClient]);

  // Presenter and active speakers first, so the sidebar shows who is actually talking
  const { orderedParticipants } = useSpeakerOrder({
    allParticipants,
    pinnedParticipantId,
    talkers,
    slotCount: MAX_VIDEO_AT_SIDE,
  });

  // Split participants into visible and audio-only groups
  const participantGroups = useMemo<ParticipantGroups>(() => {
    const unpinnedParticipants = orderedParticipants.filter(
      (p) => p.participant.uid !== pinnedParticipantId,
    );

    // Visible participants (shown in sidebar)
    const visibleUnpinned = unpinnedParticipants.slice(0, participantCounts.maxPlayingParticipants);

    // Audio-only participants (in others card - still need audio)
    const audioOnlyParticipants = unpinnedParticipants.slice(
      participantCounts.maxPlayingParticipants,
    );

    return {
      visibleUnpinned,
      audioOnlyParticipants,
    };
  }, [orderedParticipants, pinnedParticipantId, participantCounts.maxPlayingParticipants]);

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

  // Render pinned video
  const renderPinnedVideo = useCallback(() => {
    if (!pinnedParticipantData) return null;

    const { participant, mediaStream, isMine } = pinnedParticipantData;
    const videoId = isMine ? 'red5pro-publisher' : `red5pro-subscriber-${pinnedParticipantId}`;
    const isOwnScreenShare =
      participant.isScreenSharing === true && participant.ownerStreamId === publishStreamId;

    const connectionQualityScore = isMine
      ? (props.networkScore?.outbound ?? 0)
      : (calculateConnectionQualityScore(props.connectionStats?.[participant.uid]) ?? 0);

    return (
      <Box className="single-video-container pinned keep-ratio">
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <VideoCard
            id={videoId}
            key={videoId}
            isRaiseHand={participant.isRaiseHand}
            isOwnScreenShare={isOwnScreenShare}
            streamId={pinnedParticipantId!}
            isPending={participant.isPending}
            autoPlay
            playsInline
            ref={(videoElement: any) => handleVideoRef(videoElement, mediaStream)}
            pinned
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
        </Box>
      </Box>
    );
  }, [
    pinnedParticipantData,
    pinnedParticipantId,
    publishStreamId,
    talkers,
    handleVideoRef,
    streamName,
    isPlayOnly,
    pinVideo,
    unpinVideo,
    layout,
    props.networkScore,
    props.connectionStats,
    props.setParticipantIdMuted,
    props.setMuteParticipantDialogOpen,
  ]);

  // Render individual video card
  const renderVideoCard = useCallback(
    (
      participantObject: ParticipantObject,
      _index: number,
      isMobileView: boolean = false,
      isAudioOnly: boolean = false,
    ) => {
      const { participant } = participantObject;
      const isOwnScreenShare =
        participant.isScreenSharing === true && participant.ownerStreamId === publishStreamId;
      const isMine = participant.uid === streamName;

      const connectionQualityScore = isMine
        ? (props.networkScore?.outbound ?? 0)
        : (calculateConnectionQualityScore(props.connectionStats?.[participant.uid]) ?? 0);

      const videoId = isMine ? 'red5pro-publisher' : `red5pro-subscriber-${participant.uid}`;

      return (
        <Box
          className={isAudioOnly ? 'audio-only-participant' : 'unpinned'}
          // Keyed by uid only: the sidebar reorders as people speak, and an index in the
          // key would remount (and briefly drop) the video on every reorder.
          key={`${isAudioOnly ? 'audio-only' : 'unpinned'}-${participant.uid}`}
        >
          <Box className="single-video-container">
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
              <VideoCard
                isMobileView={isMobileView}
                id={videoId}
                key={videoId}
                streamId={participant.uid}
                isPending={participant.isPending} // Always false to maintain audio
                hidePlayer={isAudioOnly} // Hide visual for audio-only participants
                isOwnScreenShare={isOwnScreenShare}
                isRaiseHand={participant.isRaiseHand}
                autoPlay
                playsInline
                ref={(videoElement: any) =>
                  handleVideoRef(videoElement, participantObject.mediaStream)
                }
                pinned={false}
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
            </Box>
          </Box>
        </Box>
      );
    },
    [
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

  // Render visible video cards
  const renderVisibleVideoCards = useCallback(
    (isMobileView: boolean = false) => {
      return participantGroups.visibleUnpinned.map((participantObject, index) =>
        renderVideoCard(participantObject, index, isMobileView, false),
      );
    },
    [participantGroups.visibleUnpinned, renderVideoCard],
  );

  // All unpinned participants (used in mobile strip to show every participant scrollably).
  // Kept in join order: the strip already shows everyone, and reordering it would shuffle
  // tiles under the user's finger mid-scroll.
  const allUnpinnedParticipants = useMemo(
    () => allParticipants.filter((p) => p.participant.uid !== pinnedParticipantId),
    [allParticipants, pinnedParticipantId],
  );

  const renderAllUnpinnedMobile = useCallback(
    () =>
      allUnpinnedParticipants.map((participantObject, index) =>
        renderVideoCard(participantObject, index, true, false),
      ),
    [allUnpinnedParticipants, renderVideoCard],
  );

  // Render audio-only participants (for those in others card)
  const renderAudioOnlyParticipants = useCallback(() => {
    return participantGroups.audioOnlyParticipants.map((participantObject, index) =>
      renderVideoCard(participantObject, index, false, true),
    );
  }, [participantGroups.audioOnlyParticipants, renderVideoCard]);

  // Render others card
  const renderOthersCard = useCallback(() => {
    if (!participantCounts.showOthers) return null;

    return (
      <Box className="unpinned">
        <Box className="single-video-container others-tile-wrapper">
          <OthersCard otherParticipantCount={participantCounts.othersCount} />
        </Box>
      </Box>
    );
  }, [participantCounts.showOthers, participantCounts.othersCount]);

  // Render unpinned gallery
  const renderUnpinnedGallery = useCallback(
    (isMobileView: boolean = false) => {
      return (
        <Box id="unpinned-gallery">
          {!isMobileView && renderVisibleVideoCards(false)}
          {renderOthersCard()}
        </Box>
      );
    },
    [renderVisibleVideoCards, renderOthersCard],
  );

  // Mobile layout structure
  if (isMobileLayout) {
    return (
      <>
        <Box className="mobile-unpinned-strip">
          <Box className="mobile-unpinned-inner">{renderAllUnpinnedMobile()}</Box>
        </Box>
        {renderPinnedVideo()}
      </>
    );
  }

  // Desktop layout structure
  return (
    <>
      {renderPinnedVideo()}
      {renderUnpinnedGallery(false)}
      {renderAudioOnlyParticipants()}
    </>
  );
});

LayoutPinned.displayName = 'LayoutPinned';

export default LayoutPinned;
