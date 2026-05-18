import { MyLocation } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { CustomizedBtn, rectangularStyle } from '../../CustomizedBtn.tsx';

interface MockLocationButtonProps {
  footer?: boolean;
  glass?: boolean;
  onSendRandomMockLocation?: () => void;
}

function MockLocationButton({ footer, glass, onSendRandomMockLocation }: MockLocationButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tooltip title={t('Send random mock location')} placement="top">
      <CustomizedBtn
        glass={glass}
        className={footer ? 'footer-icon-button' : ''}
        variant="contained"
        color="secondary"
        sx={rectangularStyle}
        onClick={() => onSendRandomMockLocation?.()}
        aria-label={t('Send random mock location')}
      >
        <MyLocation sx={{ fontSize: 24, color: theme.palette.themeColor[99] }} />
      </CustomizedBtn>
    </Tooltip>
  );
}

export default MockLocationButton;
