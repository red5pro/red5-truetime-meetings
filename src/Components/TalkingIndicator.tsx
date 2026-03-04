import React from 'react';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material';

interface TalkingIndicatorWrapperProps {
  isVisible: boolean;
  borderColor: string;
  id: string;
}

interface TalkingIndicatorProps {
  streamId: string;
  talkers: string[];
}

const TalkingIndicatorWrapper = styled('div')<TalkingIndicatorWrapperProps>(
  ({ isVisible, borderColor }) => ({
    display: isVisible ? 'block' : 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    width: '100%',
    pointerEvents: 'none',
    zIndex: 15, // Higher than overlay buttons (z-index 100) but lower than dialogs
    borderRadius: '12px',
    boxSizing: 'border-box',

    // Use box-shadow instead of border to avoid taking up space
    boxShadow: `inset 0 0 0 2px ${borderColor}`,
  }),
);

const TalkingIndicator: React.FC<TalkingIndicatorProps> = ({ streamId, talkers }) => {
  const theme = useTheme();
  const isTalking = talkers.some((talkerId) => {
    const baseStreamId = streamId.split('_')[0];
    const baseTalkerId = talkerId.split('_')[0];
    return baseStreamId === baseTalkerId || streamId === talkerId;
  });

  return (
    <TalkingIndicatorWrapper
      isVisible={isTalking}
      borderColor={theme.palette.themeColor?.[0] || '#fff'}
      id={`${streamId}-is-talking`}
    />
  );
};

export default TalkingIndicator;
