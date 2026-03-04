import { Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// @ts-expect-error: temporary fix for legacy code
import CustomCard from '../CustomCard';
// @ts-expect-error: temporary fix for legacy code
import defaultAvatar from '../../static/images/defaultAvatar.png';
// @ts-expect-error: temporary fix for legacy code
import { getFirstLetter, isNull } from '../../utils/utils';

interface DummyCardProps {
  isVisible: boolean;
  streamName: string | null;
}

function DummyCard({ isVisible, streamName }: DummyCardProps) {
  const theme = useTheme();

  return isVisible ? (
    <CustomCard theme={theme}>
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
