import { Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// @ts-expect-error - legacy component has no proper type exports
import CustomCard from '../CustomCard';
// @ts-expect-error - no type declarations for static asset import
import defaultAvatar from '../../static/images/defaultAvatar.png';
// @ts-expect-error - no type declarations available for this import
import { getFirstLetter, isNull } from '../../utils/utils';

interface DummyCardProps {
  isVisible: boolean;
  streamName: string | null;
}

function DummyCard({ isVisible, streamName }: DummyCardProps) {
  const theme = useTheme();

  return isVisible ? (
    // Darker fill: the camera, mic and effects buttons sit on this card (lobby, tile controls), and
    // the default gradient ends in the same grey as their fill
    <CustomCard theme={theme} hasOverlayButtons>
      {isNull(streamName) ? (
        <Avatar
          sx={{
            width: '16%',
            height: 'auto',
            aspectRatio: '1 / 1',
            maxWidth: 128,
            maxHeight: 128,
          }}
          src={defaultAvatar}
        />
      ) : (
        <Avatar
          sx={{
            width: '16%',
            height: 'auto',
            aspectRatio: '1 / 1',
            maxWidth: 128,
            maxHeight: 128,
            backgroundColor: theme?.palette?.themeColor?.[50],
            color: '#fff',
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          {getFirstLetter(streamName) || 'R'}
        </Avatar>
      )}
    </CustomCard>
  ) : null;
}

export default DummyCard;
