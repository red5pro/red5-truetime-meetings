import React from 'react';
import { Tooltip } from '@mui/material';
import { ClosedCaption, ClosedCaptionDisabled } from '@mui/icons-material';
// @ts-expect-error: temporary fix for legacy code
import { CustomizedBtn, rectangularStyle, roundStyle } from '../../CustomizedBtn.tsx';
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
  glass = false,
  footer = false,
  disabled = false,
}) => {
  // Check if closed caption feature is enabled
  const isCaptionEnabled = getRuntimeConfig().VITE_ENABLE_CLOSED_CAPTION === 'true';

  // Get button color variant
  const getButtonColor = (): 'primary' | 'secondary' => {
    return captionsVisible ? 'primary' : 'secondary';
  };

  // Get tooltip text based on feature availability
  const getTooltipText = (): string => {
    if (!isCaptionEnabled) {
      return 'Upgrade your plan to support closed captioning';
    }
    return captionsVisible ? 'Hide Captions' : 'Show Captions';
  };

  return (
    <Tooltip title={getTooltipText()} placement="top">
      <span>
        <CustomizedBtn
          className={footer ? 'footer-icon-button' : ''}
          id="captions-button"
          glass={glass}
          sx={rectangularStyle}
          onClick={onToggleCaptions}
          disabled={disabled || !isCaptionEnabled}
          variant="contained"
          color={getButtonColor()}
        >
          {captionsVisible ? <ClosedCaption /> : <ClosedCaptionDisabled />}
        </CustomizedBtn>
      </span>
    </Tooltip>
  );
};

export default CaptionsButton;
