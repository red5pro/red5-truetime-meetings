import { VideoPreviewProps } from '../types.ts';
import { Box } from '@mui/system';
import VideoCard from '../../../Components/Cards/VideoCard.tsx';
import React from 'react';

export const VideoPreview = React.memo<VideoPreviewProps>(
  ({
    publishStreamId,
    streamName,
    isPublished,
    isPlayOnly,
    isMyMicMuted,
    isMyCamTurnedOff,
    pinVideo,
    unpinVideo,
    layout,
  }) => (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <VideoCard
        id="red5pro-publisher"
        key="red5pro-publisher"
        autoPlay
        hidePin
        isMine={true}
        // @ts-expect-error: temporary fix for legacy code
        streamName={streamName}
        isPublished={isPublished}
        isPlayOnly={isPlayOnly}
        isMicMuted={isMyMicMuted}
        isCamTurnedOff={isMyCamTurnedOff}
        publishStreamId={publishStreamId}
        pinVideo={pinVideo}
        unpinVideo={unpinVideo}
        layout={layout}
        talkers={[]} // this is local video so no need to pass talkers at all
        setParticipantIdMuted={() => {}}
        setMuteParticipantDialogOpen={() => {}}
      />
    </Box>
  ),
);

VideoPreview.displayName = 'VideoPreview';
