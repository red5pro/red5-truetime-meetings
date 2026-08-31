import React, { useMemo, useCallback } from 'react';
import { Box } from '@mui/system';

import VideoCard from '../../Components/Cards/VideoCard.tsx';
import OthersCard from '../../Components/Cards/OthersCard.tsx';
import {
  calculateConnectionQualityScore,
  isNull,
  isScreenShareParticipant,
} from '../../utils/utils.tsx';
import { useSpeakerOrder } from '../../hooks/useSpeakerOrder.ts';
import { LayoutAutoProps, Participant, ParticipantObject } from './types.ts';

// Constants
const MAX_VIDEO_AT_SIDE = 3;
const LAYOUT_CLASSES = {
  PINNED_MAIN: 'pinned-main',
  SIDEBAR_VIDEO: 'sidebar-video',
  IN_OTHERS: 'in-others',
  TILED: 'tiled',
} as const;
type LayoutClass = (typeof LAYOUT_CLASSES)[keyof typeof LAYOUT_CLASSES];

const LayoutAuto = React.memo<LayoutAutoProps>((props) => {
  const {
    pinLayout,
    allParticipants = [],
    pinnedParticipantId,
    globals,
    talkers,
    streamName,
    publishStreamId,
    isPlayOnly,
    pinVideo,
    unpinVideo,
    layout,
    currentConferenceClient,
  } = props;

  // Presenter and active speakers first, so the sidebar shows who is actually talking
  const { orderedParticipants } = useSpeakerOrder({
    allParticipants,
    pinnedParticipantId,
    talkers,
  });

  // Memoized layout class calculator
  const getLayoutClass = useCallback(
    (participant: Participant): LayoutClass => {
      if (!pinLayout) return LAYOUT_CLASSES.TILED;

      if (participant.uid === pinnedParticipantId) {
        return LAYOUT_CLASSES.PINNED_MAIN;
      }

      const sidebarParticipants = orderedParticipants
        .filter((p) => p.participant.uid !== pinnedParticipantId)
        .slice(0, MAX_VIDEO_AT_SIDE);

      const sideIndex = sidebarParticipants.findIndex((p) => p.participant.uid === participant.uid);

      return sideIndex !== -1 ? LAYOUT_CLASSES.SIDEBAR_VIDEO : LAYOUT_CLASSES.IN_OTHERS;
    },
    [pinLayout, pinnedParticipantId, orderedParticipants],
  );

  // Memoized sidebar videos for performance. Speaker order drives --sidebar-index, so tiles
  // slide into place via CSS instead of being remounted.
  const sidebarVideos = useMemo(() => {
    if (!pinLayout) return [];
    return orderedParticipants.filter(
      (p) => getLayoutClass(p.participant) === LAYOUT_CLASSES.SIDEBAR_VIDEO,
    );
  }, [orderedParticipants, pinLayout, getLayoutClass]);

  // Memoized others count calculation
  const othersCount = useMemo(() => {
    if (!pinLayout) return 0;
    return Math.max(0, allParticipants.length - 1 - MAX_VIDEO_AT_SIDE);
  }, [pinLayout, allParticipants.length]);

  // Memoized container class calculation
  const containerClass = useMemo(() => {
    if (pinLayout) {
      return 'video-layout layout-pinned';
    }

    const participantCount = Math.min(
      allParticipants.length + (pinLayout && othersCount > 0 ? 1 : 0),
      6,
    );
    return `video-layout layout-tiled participants-${participantCount}`;
  }, [pinLayout, allParticipants.length, othersCount]);

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

  // Render individual video
  const renderVideo = useCallback(
    (participantObject: ParticipantObject, _index: number, forceAudioOnly: boolean = false) => {
      const { participant } = participantObject;
      const layoutClass = getLayoutClass(participant);
      const isOwnScreenShare =
        participant.isScreenSharing === true && participant.ownerStreamId === publishStreamId;
      const isMine = participant.uid === streamName;
      const isHidden = forceAudioOnly || layoutClass === LAYOUT_CLASSES.IN_OTHERS;

      // Calculate sidebar index for CSS positioning
      const sidebarIndex =
        layoutClass === LAYOUT_CLASSES.SIDEBAR_VIDEO
          ? sidebarVideos.findIndex((p) => p.participant.uid === participant.uid)
          : 0;

      const containerStyle =
        layoutClass === LAYOUT_CLASSES.SIDEBAR_VIDEO
          ? ({ '--sidebar-index': sidebarIndex } as React.CSSProperties)
          : {};

      const videoId = isMine ? 'red5pro-publisher' : `red5pro-subscriber-${participant.uid}`;

      const connectionQualityScore = isMine
        ? (props.networkScore?.outbound ?? 0)
        : (calculateConnectionQualityScore(props.connectionStats?.[participant.uid]) ?? 0);

      return (
        <Box
          key={`video-${participant.uid}`}
          className={`single-video-container ${isHidden ? 'audio-only-participant' : layoutClass}`}
          style={containerStyle}
        >
          <VideoCard
            id={videoId}
            key={videoId}
            isRaiseHand={participant.isRaiseHand}
            isOwnScreenShare={isOwnScreenShare}
            streamId={participant.uid}
            isPending={participant.isPending}
            hidePlayer={isHidden}
            autoPlay
            playsInline
            ref={(videoElement: any) => handleVideoRef(videoElement, participantObject.mediaStream)}
            pinned={participant.uid === pinnedParticipantId}
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
      );
    },
    [
      getLayoutClass,
      streamName,
      publishStreamId,
      currentConferenceClient,
      sidebarVideos,
      talkers,
      pinnedParticipantId,
      isPlayOnly,
      pinVideo,
      unpinVideo,
      layout,
      handleVideoRef,
      props.networkScore,
      props.connectionStats,
      props.setParticipantIdMuted,
      props.setMuteParticipantDialogOpen,
    ],
  );

  // Render others card
  const renderOthersCard = useCallback(() => {
    if (!pinLayout || othersCount <= 0) return null;

    const othersStyle = {
      '--sidebar-index': sidebarVideos.length,
    } as React.CSSProperties;

    return (
      <Box className="others-tile-wrapper" style={othersStyle}>
        <OthersCard otherParticipantCount={othersCount} />
      </Box>
    );
  }, [pinLayout, othersCount, sidebarVideos.length]);

  // Split visible and audio-only participants for pinned mode
  const { visibleParticipants, audioOnlyParticipants } = useMemo(() => {
    const tileCount = globals?.desiredTileCount || allParticipants.length;

    if (!pinLayout) {
      return {
        visibleParticipants: allParticipants.slice(0, tileCount),
        audioOnlyParticipants: [] as ParticipantObject[],
      };
    }

    const visible: ParticipantObject[] = [];
    const audioOnly: ParticipantObject[] = [];

    allParticipants.forEach((participantObject) => {
      const layoutClass = getLayoutClass(participantObject.participant);
      if (layoutClass === LAYOUT_CLASSES.IN_OTHERS) {
        audioOnly.push(participantObject);
      } else {
        visible.push(participantObject);
      }
    });

    return { visibleParticipants: visible, audioOnlyParticipants: audioOnly };
  }, [allParticipants, globals?.desiredTileCount, pinLayout, getLayoutClass]);

  return (
    <>
      <Box className={containerClass}>
        {visibleParticipants.map((participantObject, index) =>
          renderVideo(participantObject, index),
        )}
        {renderOthersCard()}
      </Box>
      {audioOnlyParticipants.map((participantObject, index) =>
        renderVideo(participantObject, index, true),
      )}
    </>
  );
});

LayoutAuto.displayName = 'LayoutAuto';

export default LayoutAuto;
