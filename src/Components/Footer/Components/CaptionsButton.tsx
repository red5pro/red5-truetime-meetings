import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClosedCaption, ClosedCaptionDisabled } from '@mui/icons-material';
import { ToolbarButton } from 'truetime-ui';
import { getRuntimeConfig } from '../../../utils/configStore';

interface CaptionsButtonProps {
  captionsVisible?: boolean;
  onToggleCaptions?: () => void;
  glass?: boolean;
  footer?: boolean;
  rounded?: boolean;
  disabled?: boolean;
}

const CaptionsButton: React.FC<CaptionsButtonProps> = ({
  captionsVisible = false,
  onToggleCaptions,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const isCaptionEnabled = getRuntimeConfig().VITE_ENABLE_CLOSED_CAPTION === 'true';

  const label = !isCaptionEnabled
    ? t('Upgrade your plan to support closed captioning')
    : captionsVisible
      ? t('Hide Captions')
      : t('Show Captions');

  return (
    <ToolbarButton
      id="captions-button"
      icon={captionsVisible ? <ClosedCaption /> : <ClosedCaptionDisabled />}
      label={label}
      pressed={captionsVisible}
      tone={captionsVisible ? 'active' : 'default'}
      disabled={disabled || !isCaptionEnabled}
      onClick={onToggleCaptions}
    />
  );
};

export default CaptionsButton;
