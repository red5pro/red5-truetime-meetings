import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface ShareScreenButtonProps {
  footer?: boolean;
  glass?: boolean;
  rounded?: boolean;
  isScreenShared?: boolean;
  handleStartScreenShare?: () => void;
  handleStopScreenShare?: () => void;
}

function ShareScreenButton(props: ShareScreenButtonProps) {
  const { t } = useTranslation();
  const handleClick = () => {
    if (props.isScreenShared) {
      props.handleStopScreenShare?.();
    } else {
      props.handleStartScreenShare?.();
    }
  };

  return (
    <ToolbarButton
      id="share-screen-button"
      icon={<SvgIcon size={24} viewBox="0 0 500 500" name="share-screen" color="currentColor" />}
      label={props.isScreenShared ? t('Stop presenting') : t('Present now')}
      pressed={Boolean(props.isScreenShared)}
      tone={props.isScreenShared ? 'active' : 'default'}
      onClick={handleClick}
    />
  );
}

export default ShareScreenButton;
