import { useEffect, type MouseEvent } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AudioLevelDots, SplitToolbarButton, ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface Device {
  deviceId: string;
  label: string;
  kind: string;
}

interface MicButtonProps {
  isMicMuted?: boolean;
  microphoneButtonDisabled?: boolean;
  toggleMic?: (muted: boolean) => void;
  audioInputs?: Device[];
  selectedMicrophone?: string;
  onMicrophoneChange?: (deviceId: string) => void;
  /** Show the options segment that opens the microphone tray (default: true). */
  showMicrophoneOptions?: boolean;
  /** The microphone tray is open. */
  optionsOpen?: boolean;
  onOptionsClick?: () => void;
  /** id of the tray the options segment opens. */
  optionsControls?: string;
  /** You are talking: the options segment's dots bounce. */
  isTalking?: boolean;
}

function MicButton(props: MicButtonProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const theme = useTheme();
  const showMicrophoneOptions = props.showMicrophoneOptions !== false;
  const { audioInputs, selectedMicrophone, onMicrophoneChange } = props;

  // Select the first microphone when none is selected yet
  useEffect(() => {
    if (!selectedMicrophone && audioInputs && audioInputs.length > 0) {
      onMicrophoneChange?.(audioInputs[0].deviceId);
    }
  }, [audioInputs, selectedMicrophone, onMicrophoneChange]);

  const handleMicToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const unmuting = Boolean(props.isMicMuted);

    enqueueSnackbar(
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SvgIcon
          size={14}
          viewBox="0 0 500 500"
          name={unmuting ? 'microphone' : 'muted-microphone'}
          color={theme.palette.themeColor[99]}
        />
        {unmuting ? t('Microphone on') : t('Microphone off')}
      </Box>,
      { variant: 'info', autoHideDuration: 1500 },
    );

    props.toggleMic?.(!unmuting);
  };

  const icon = (
    <SvgIcon
      size={24}
      viewBox="0 0 500 500"
      name={props.isMicMuted ? 'muted-microphone' : 'microphone'}
      color="currentColor"
    />
  );
  const label = t(props.isMicMuted ? 'Turn on microphone' : 'Turn off microphone');
  const tone = props.isMicMuted && !props.microphoneButtonDisabled ? 'off' : 'default';

  if (!showMicrophoneOptions) {
    return (
      <ToolbarButton
        id="mic-button"
        icon={icon}
        label={label}
        tone={tone}
        disabled={props.microphoneButtonDisabled}
        onClick={handleMicToggle}
      />
    );
  }

  return (
    <SplitToolbarButton
      id="mic-button"
      icon={icon}
      label={label}
      tone={tone}
      disabled={props.microphoneButtonDisabled}
      onClick={handleMicToggle}
      optionsLabel={t('Microphone options')}
      optionsOpen={props.optionsOpen}
      optionsControls={props.optionsControls}
      onOptionsClick={() => props.onOptionsClick?.()}
      idleIndicator={
        props.isMicMuted ? undefined : <AudioLevelDots active={Boolean(props.isTalking)} />
      }
    />
  );
}

export default MicButton;
