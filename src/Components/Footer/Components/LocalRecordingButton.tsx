import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { ToolbarButton, themeColors } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface LocalRecordingButtonProps {
  open?: boolean;
  onClick?: (open: boolean) => void;
  isActive?: boolean;
}

const pulse = keyframes`
  0%, 100% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
`;

function LocalRecordingButton(props: LocalRecordingButtonProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <ToolbarButton
        id="local-recording-button"
        icon={<SvgIcon size={24} viewBox="0 0 500 500" name="camera" color="currentColor" />}
        label={t('Local Recording Status')}
        pressed={Boolean(props.open)}
        tone={props.open ? 'active' : 'ghost'}
        onClick={() => props.onClick?.(!props.open)}
      />
      {props.isActive && (
        <Box
          aria-hidden
          sx={(theme) => ({
            position: 'absolute',
            top: 10,
            right: 10,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: themeColors(theme).error,
            border: `2px solid ${themeColors(theme).surfaceRaised}`,
            pointerEvents: 'none',
            animation: `${pulse} 1.5s infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          })}
        />
      )}
    </Box>
  );
}

export default LocalRecordingButton;
