import { useEffect, type MouseEvent } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { SplitToolbarButton, ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface Device {
  deviceId: string;
  label: string;
  kind: string;
}

interface CameraButtonProps {
  isCamTurnedOff?: boolean;
  cameraButtonDisabled?: boolean;
  onTurnOffCamera?: () => void;
  onTurnOnCamera?: () => void;
  videoInputs?: Device[];
  selectedCamera?: string;
  onCameraChange?: (deviceId: string) => void;
  /** Show the options segment that opens the camera tray (default: true). */
  showCameraOptions?: boolean;
  /** The camera tray is open. */
  optionsOpen?: boolean;
  onOptionsClick?: () => void;
  /** id of the tray the options segment opens. */
  optionsControls?: string;
}

function CameraButton(props: CameraButtonProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const showCameraOptions = props.showCameraOptions !== false;
  const { videoInputs, selectedCamera, onCameraChange } = props;

  // Select the first camera when none is selected yet
  useEffect(() => {
    if (!selectedCamera && videoInputs && videoInputs.length > 0) {
      onCameraChange?.(videoInputs[0].deviceId);
    }
  }, [videoInputs, selectedCamera, onCameraChange]);

  const handleCameraToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const isTurningOff = !props.isCamTurnedOff;

    enqueueSnackbar(
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SvgIcon
          size={14}
          viewBox="0 0 500 500"
          name={isTurningOff ? 'camera-off' : 'camera'}
          color={theme.palette.themeColor[99]}
        />
        {isTurningOff ? t('Camera turned off') : t('Camera turned on')}
      </Box>,
      { variant: 'info', autoHideDuration: 1500 },
    );

    if (isTurningOff) {
      props.onTurnOffCamera?.();
    } else {
      props.onTurnOnCamera?.();
    }
  };

  const icon = (
    <SvgIcon
      size={24}
      viewBox="0 0 500 500"
      name={props.isCamTurnedOff ? 'camera-off' : 'camera'}
      color="currentColor"
    />
  );
  const label = t(props.isCamTurnedOff ? 'Turn on camera' : 'Turn off camera');
  const tone = props.isCamTurnedOff && !props.cameraButtonDisabled ? 'off' : 'default';

  if (!showCameraOptions) {
    return (
      <ToolbarButton
        id="camera-button"
        icon={icon}
        label={label}
        tone={tone}
        disabled={props.cameraButtonDisabled}
        onClick={handleCameraToggle}
      />
    );
  }

  return (
    <SplitToolbarButton
      id="camera-button"
      icon={icon}
      label={label}
      tone={tone}
      disabled={props.cameraButtonDisabled}
      onClick={handleCameraToggle}
      optionsLabel={t('Camera options')}
      optionsOpen={props.optionsOpen}
      optionsControls={props.optionsControls}
      onOptionsClick={() => props.onOptionsClick?.()}
    />
  );
}

export default CameraButton;
