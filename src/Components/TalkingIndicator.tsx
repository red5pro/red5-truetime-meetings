import React, { useMemo } from 'react';
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

    // Fade in fast, fade out slow, so the ring never pops on a brief pause.
    opacity: isVisible ? 1 : 0,
    transition: isVisible ? 'opacity 120ms ease-out' : 'opacity 400ms ease-in',
    willChange: 'opacity',
  }),
);

const TalkingIndicator: React.FC<TalkingIndicatorProps> = ({ streamId, talkers }) => {
  const theme = useTheme();

  // Exact match only: a screen share publishes under a separate id derived from its
  // owner's, so loose matching used to light up the sharer's tiles too.
  const isTalking = useMemo(() => !!streamId && talkers.includes(streamId), [streamId, talkers]);

  return (
    <TalkingIndicatorWrapper
      isVisible={isTalking}
      borderColor={theme.palette.themeColor?.[0] || '#fff'}
      id={`${streamId}-is-talking`}
    />
  );
};

export default TalkingIndicator;
