import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface EndCallButtonProps {
  onLeaveRoom?: () => void;
  glass?: boolean;
  footer?: boolean;
}

function EndCallButton(props: EndCallButtonProps) {
  const { t } = useTranslation();
  return (
    <ToolbarButton
      id="leave-room-button"
      icon={<SvgIcon size={24} viewBox="0 0 500 500" name="end-call" color="currentColor" />}
      label={t('Leave call')}
      tone="danger"
      size="wide"
      onClick={props.onLeaveRoom}
    />
  );
}

export default EndCallButton;
