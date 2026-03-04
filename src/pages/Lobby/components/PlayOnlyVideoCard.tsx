import React from 'react';
import { PlayOnlyVideoCardProps } from '../types.ts';
import VideoCard from '../../../Components/Cards/VideoCard.tsx';

export const PlayOnlyVideoCard = React.memo<PlayOnlyVideoCardProps>(
  ({
    streamName,
    isPublished,
    isPlayOnly,
    isMyMicMuted,
    isMyCamTurnedOff,
    publishStreamId,
    pinVideo,
    unpinVideo,
    layout,
  }) => (
    <VideoCard
      id="red5pro-publisher"
      key="red5pro-publisher"
      autoPlay
      hidePin
      isMine={true}
      //@ts-ignore
      streamName={streamName}
      isPublished={isPublished}
      isPlayOnly={isPlayOnly}
      isMicMuted={isMyMicMuted}
      isCamTurnedOff={isMyCamTurnedOff}
      publishStreamId={publishStreamId}
      pinVideo={pinVideo}
      unpinVideo={unpinVideo}
      hidePlayer
      layout={layout}
      setParticipantIdMuted={() => {}}
      setMuteParticipantDialogOpen={() => {}}
    />
  ),
);

PlayOnlyVideoCard.displayName = 'PlayOnlyVideoCard';
