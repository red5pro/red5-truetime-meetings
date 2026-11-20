import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { radii, themeColors } from 'truetime-ui';

interface OthersCardProps {
  otherParticipantCount: number;
}

/** "+N others" tile for the people who don't fit in the pinned layout's sidebar. */
function OthersCard({ otherParticipantCount }: OthersCardProps) {
  const { t } = useTranslation();
  const count = Math.max(otherParticipantCount, 0);

  return (
    <Box
      className="others-tile-inner"
      sx={(theme) => ({
        width: '100%',
        height: '100%',
        borderRadius: `${radii.control}px`,
        // Same surface as a tile with no video yet
        backgroundColor: themeColors(theme).surfaceRaised,
      })}
    >
      <Typography sx={(theme) => ({ color: themeColors(theme).text })}>
        {count} {count > 1 ? t('Others') : t('Other')}
      </Typography>
    </Box>
  );
}

export default OthersCard;
