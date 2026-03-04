import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
// @ts-ignore
import { CustomizedBtn, rectangularStyle, roundStyle } from '../../CustomizedBtn.tsx';

interface EndCallButtonProps {
  onLeaveRoom?: () => void;
  glass?: boolean;
  footer?: boolean;
}

function EndCallButton(props: EndCallButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tooltip title={t('Leave call')} placement="top">
      <CustomizedBtn
        id="leave-room-button"
        sx={rectangularStyle}
        onClick={props?.onLeaveRoom}
        glass={props?.glass}
        className={props?.footer ? 'footer-icon-button' : ''}
        variant="contained"
        color="error"
      >
        <SvgIcon
          size={24}
          viewBox="0 0 500 500"
          name="end-call"
          color={theme.palette.themeColor[99]} // Pure white from theme
        />
      </CustomizedBtn>
    </Tooltip>
  );
}

export default EndCallButton;
