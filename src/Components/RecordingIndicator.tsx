import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  enterAnimation,
  monoText,
  motion,
  pulse,
  radii,
  readableOn,
  reducedMotion,
  themeColors,
  visuallyHidden,
} from 'truetime-ui';

const formatElapsed = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
};

export interface RecordingIndicatorProps {
  didIStart?: boolean;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ didIStart }) => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Only run timer if we started the recording
    if (!didIStart) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [didIStart]);

  const label = t('Recording');

  return (
    // A status region, so screen readers announce it when recording starts
    <Box
      role="status"
      sx={[
        (theme) => {
          const colors = themeColors(theme);
          const ink = readableOn(colors.error, theme.palette.themeColor[90], colors.text);
          return {
            position: 'absolute',
            top: 10,
            left: 10,
            // Above the video grid and its controls, below drawers and dialogs
            zIndex: theme.zIndex.appBar,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.25,
            py: 0.625,
            borderRadius: `${radii.control}px`,
            backgroundColor: colors.error,
            color: ink,
            fontSize: 14,
            fontWeight: 600,
            '--rec-dot': ink,
          };
        },
        enterAnimation({ variant: 'pop' }),
      ]}
    >
      <Box
        aria-hidden
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: 'var(--rec-dot)',
          animation: `${pulse} ${motion.duration.slow * 5}ms ${motion.easing.standard} infinite`,
          [reducedMotion]: { animation: 'none' },
        }}
      />
      <span>{label}</span>
      {didIStart && (
        <Box component="span" sx={{ ...monoText, fontWeight: 500 }}>
          <Box component="span" sx={visuallyHidden}>
            {t('Elapsed time')}{' '}
          </Box>
          {formatElapsed(elapsed)}
        </Box>
      )}
    </Box>
  );
};

export default RecordingIndicator;
