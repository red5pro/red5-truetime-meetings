import React from 'react';
import { alpha, Theme } from '@mui/material/styles';
import { Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { radii, themeColors, transition } from 'truetime-ui';

interface ConnectionQualityBarProps {
  streamId: string;
  isMine: boolean;
  /** Score from 0 to 5. */
  connectionQuality?: number;
  theme: Theme;
}

type Level = 'good' | 'fair' | 'poor';

const levelOf = (score: number): Level => (score >= 3.5 ? 'good' : score >= 2.5 ? 'fair' : 'poor');

const BAR_COUNT = 4;

/**
 * Signal bars for a tile. The number of lit bars carries the level, so colour only reinforces it:
 * success when good, warning when fair, error when poor (the theme's own state colours).
 */
export const ConnectionQualityBar = React.memo<ConnectionQualityBarProps>(
  ({ connectionQuality = 0, theme }) => {
    const { t } = useTranslation();
    const colors = themeColors(theme);
    const level = levelOf(connectionQuality);
    const color = { good: colors.success, fair: colors.warning, poor: colors.error }[level];
    const levelText = { good: t('good'), fair: t('fair'), poor: t('poor') }[level];
    const label = t('Connection quality: {{level}} ({{score}} of 5)', {
      level: levelText,
      score: connectionQuality.toFixed(1),
    });

    return (
      <Tooltip title={label} placement="top">
        <Box
          role="img"
          aria-label={label}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            zIndex: 2,
            display: 'flex',
            alignItems: 'flex-end',
            gap: '1px',
            padding: '4px 6px',
            borderRadius: `${radii.control}px`,
            // Same translucent black as the tile's name chip, so it reads on any video
            backgroundColor: alpha(colors.monitor, 0.6),
          }}
        >
          {Array.from({ length: BAR_COUNT }, (_, index) => (
            <Box
              key={index}
              aria-hidden
              sx={{
                width: 3,
                height: 4 + index * 2,
                borderRadius: '1px',
                backgroundColor:
                  (connectionQuality / 5) * BAR_COUNT > index ? color : alpha(colors.text, 0.25),
                transition: transition('background-color'),
              }}
            />
          ))}
        </Box>
      </Tooltip>
    );
  },
);

ConnectionQualityBar.displayName = 'ConnectionQualityBar';
