import * as React from 'react';
import { isMobile } from 'react-device-detect';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import {
  MenuItem,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Typography,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { SvgIcon } from '../../SvgIcon.js';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getDialogStyle } from '../../../styles/themeUtil.js';
// @ts-expect-error - legacy component has no proper type exports
import { isNull } from '../../../utils/utils.tsx';
import { BitrateOptionsList } from '../../../constants/bitrateOptionsList.js';
import { QuestionMarkRounded } from '@mui/icons-material';
import { Slider, Spinner, Switch as ToggleSwitch, themeColors } from 'truetime-ui';
import type { NoiseSuppressionStatus } from '../../../hooks/useNoiseSuppression';

interface Device {
  deviceId: string;
  label: string;
}

interface DeviceList {
  videoInputs?: Device[];
  audioInputs?: Device[];
  audioOutputs?: Device[];
}

interface Red5DialogTitleProps {
  children: React.ReactNode;
  onClose?: () => void;
}

interface SettingsDialogProps {
  open?: boolean;
  onClose?: (selectedValue?: any) => void;
  selectedValue?: any;
  selectFocus?: 'camera' | 'speaker' | 'audio' | string;
  devices?: DeviceList;
  selectedCamera?: string;
  selectedMicrophone?: string;
  selectedSpeaker?: string;
  selectedBackgroundMode?: string;
  outgoingBitrate?: string;
  pushToTalkEnabled?: boolean;
  cameraSelected?: (deviceId: string) => void;
  microphoneSelected?: (deviceId: string) => void;
  speakerSelected?: (deviceId: string) => void;
  setSelectedBackgroundMode?: (mode: string) => void;
  updateOutgoingBitrate?: (bitrate: string) => void;
  onPushToTalkToggle?: (enabled: boolean) => void;
  /** Which settings to show: `video` (camera, video quality), `audio` (mic, speaker, noise
   * suppression, push to talk), or both when left out. */
  section?: 'audio' | 'video';
  noiseSuppressionEnabled?: boolean;
  noiseSuppressionStatus?: NoiseSuppressionStatus;
  onNoiseSuppressionToggle?: (enabled: boolean) => void;
  /** Share of the background noise removed, 0-100 */
  noiseSuppressionPercent?: number;
  onNoiseSuppressionPercentChange?: (percent: number) => void;
}

/** Lowest level offered: below this the model barely changes anything */
const MIN_NOISE_SUPPRESSION_PERCENT = 10;

const Red5DialogTitle: React.FC<Red5DialogTitleProps> = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle {...other} sx={{ color: '#fff', textAlign: 'center', pb: 1 }}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 26,
            top: 27,
          }}
        >
          <SvgIcon size={20} viewBox="0 0 500 500" name={'close'} color={'#fff'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export default function SettingsDialog(props: SettingsDialogProps) {
  const { t } = useTranslation();

  const theme = useTheme();
  const section = props?.section;
  const showVideo = section !== 'audio';
  const showAudio = section !== 'video';
  const title =
    section === 'audio'
      ? 'Audio Settings'
      : section === 'video'
        ? 'Video Settings'
        : 'Call Settings';
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  // Local state for push-to-talk
  const [localPushToTalkEnabled, setLocalPushToTalkEnabled] = React.useState<boolean>(
    props?.pushToTalkEnabled || false,
  );
  const [selectedFacingMode, setSelectedFacingMode] = React.useState<'user' | 'environment' | null>(
    null,
  );

  const mobileCameraOptions = [
    { id: 'facingMode:user', label: t('Front Camera') },
    { id: 'facingMode:environment', label: t('Back Camera') },
  ];

  // Sync with props
  React.useEffect(() => {
    queueMicrotask(() => setLocalPushToTalkEnabled(props?.pushToTalkEnabled || false));
  }, [props?.pushToTalkEnabled]);

  // Shown while the slider is dragged; applied when it's let go
  const [draftPercent, setDraftPercent] = React.useState<number | null>(null);
  const shownPercent = Math.max(
    MIN_NOISE_SUPPRESSION_PERCENT,
    draftPercent ?? props?.noiseSuppressionPercent ?? MIN_NOISE_SUPPRESSION_PERCENT,
  );
  // Changes only reach the model once it runs
  const noiseSuppressionReady = props?.noiseSuppressionStatus === 'ready';
  const noiseSuppressionNote =
    props?.noiseSuppressionStatus === 'unavailable'
      ? t('Not available')
      : noiseSuppressionReady
        ? null
        : props?.noiseSuppressionStatus === 'downloading'
          ? t('Downloading…')
          : t('Initializing…');

  const handleClose = (_event?: any, _reason?: string): void => {
    props?.onClose?.(props?.selectedValue);
  };

  const switchVideoMode = (value: string): void => {
    props?.cameraSelected?.(value);
  };

  const switchAudioMode = (value: string): void => {
    props?.microphoneSelected?.(value);
  };

  const switchSpeakerMode = (value: string): void => {
    props?.speakerSelected?.(value);
  };

  // Handle push-to-talk toggle
  const handlePushToTalkToggle = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = event.target.checked;
    setLocalPushToTalkEnabled(newValue);
    props?.onPushToTalkToggle?.(newValue);
  };

  const handleCameraChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (value.startsWith('facingMode:')) {
      const facingMode = value.split(':')[1] as 'user' | 'environment';
      setSelectedFacingMode(facingMode);
    }
    switchVideoMode(value);
  };

  const handleMicrophoneChange = (event: SelectChangeEvent<string>): void => {
    switchAudioMode(event.target.value);
  };

  const handleSpeakerChange = (event: SelectChangeEvent<string>): void => {
    switchSpeakerMode(event.target.value);
  };

  const handleBitrateChange = (event: SelectChangeEvent<string>): void => {
    props?.updateOutgoingBitrate?.(event.target.value);
  };

  React.useEffect(() => {
    if (props?.devices) {
      const cameraDevices = props?.devices.videoInputs;
      const audioDevices = props?.devices.audioInputs;
      const speakerDevices = props?.devices.audioOutputs;

      if (
        cameraDevices &&
        cameraDevices.length > 0 &&
        (props?.selectedCamera === '' || isNull(props?.selectedCamera))
      ) {
        props?.cameraSelected?.(cameraDevices[0].deviceId);
      }
      if (
        audioDevices &&
        audioDevices.length > 0 &&
        (props?.selectedMicrophone === '' || isNull(props?.selectedMicrophone))
      ) {
        props?.microphoneSelected?.(audioDevices[0].deviceId);
      }
      if (
        speakerDevices &&
        speakerDevices.length > 0 &&
        (props?.selectedSpeaker === '' || isNull(props?.selectedSpeaker))
      ) {
        props?.speakerSelected?.(speakerDevices[0].deviceId);
      }
      if (props?.selectedBackgroundMode === '') {
        props?.setSelectedBackgroundMode?.('none');
      }
    }
  }, [props]);

  return (
    <Dialog
      onClose={handleClose}
      open={props?.open || false}
      fullScreen={fullScreen}
      maxWidth={'sm'}
      id="settings-dialog"
      PaperProps={{ sx: getDialogStyle(theme) }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(0.5px)',
        },
      }}
    >
      <Red5DialogTitle onClose={handleClose}>{t(title)}</Red5DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {showVideo && (
            <>
              {/* Camera Section */}
              <Grid container>
                <Grid size={12}>
                  <InputLabel sx={{ color: '#fff', mb: 1 }}>{t('Camera')}</InputLabel>
                </Grid>
                <Grid size={12} sx={{ width: '100vw' }}>
                  <Select
                    autoFocus={section === 'video' || props?.selectFocus === 'camera'}
                    fullWidth
                    id="setting-dialog-camera-select"
                    variant="outlined"
                    value={
                      isMobile
                        ? selectedFacingMode
                          ? `facingMode:${selectedFacingMode}`
                          : 'facingMode:user'
                        : props?.selectedCamera || ''
                    }
                    onChange={handleCameraChange}
                    sx={{ color: '#fff', width: '100%' }}
                    endAdornment={
                      <InputAdornment position="end" sx={{ mr: 2 }}>
                        <SvgIcon size={24} viewBox="0 0 500 500" name={'camera'} color={'#fff'} />
                      </InputAdornment>
                    }
                  >
                    {isMobile
                      ? mobileCameraOptions.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.label}
                          </MenuItem>
                        ))
                      : props?.devices?.videoInputs &&
                        props?.devices?.videoInputs?.length > 0 &&
                        props?.devices?.videoInputs.map((device) => (
                          <MenuItem key={device.deviceId} value={device.deviceId}>
                            {device.label}
                          </MenuItem>
                        ))}
                  </Select>
                </Grid>
              </Grid>

              {/* Video Quality Section */}
              <Grid container sx={{ mt: 4 }}>
                <Grid size={12}>
                  <InputLabel sx={{ color: '#fff', mb: 1 }}>
                    {t('Outgoing Video Quality Limit')}
                  </InputLabel>
                </Grid>
                <Grid size={12} sx={{ width: '100vw' }}>
                  <Select
                    variant="outlined"
                    fullWidth
                    value={props?.outgoingBitrate || ''}
                    onChange={handleBitrateChange}
                    sx={{ color: '#fff', width: '100%' }}
                    id="setting-dialog-bitrate-select"
                    endAdornment={
                      <InputAdornment position="end" sx={{ mr: 2 }}>
                        <SvgIcon
                          viewBox={'0 0 24 24'}
                          size={24}
                          name={'bitrate-limit'}
                          color={'#fff'}
                        />
                      </InputAdornment>
                    }
                  >
                    {Object.entries(BitrateOptionsList).map(([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value} kbps
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </Grid>
            </>
          )}

          {showAudio && (
            <>
              {/* Microphone Section */}
              <Grid container sx={{ mt: showVideo ? 4 : 0 }}>
                <Grid size={12}>
                  <InputLabel sx={{ color: '#fff', mb: 1 }}>{t('Microphone')}</InputLabel>
                </Grid>
                <Grid size={12} sx={{ width: '100vw' }}>
                  <Select
                    autoFocus={section === 'audio' || props?.selectFocus === 'audio'}
                    variant="outlined"
                    fullWidth
                    value={props?.selectedMicrophone || ''}
                    onChange={handleMicrophoneChange}
                    sx={{ color: '#fff', width: '100%' }}
                    id="setting-dialog-mic-select"
                    endAdornment={
                      <InputAdornment position="end" sx={{ mr: 2 }}>
                        <SvgIcon
                          size={24}
                          viewBox="0 0 500 500"
                          name={'microphone'}
                          color={'#fff'}
                        />
                      </InputAdornment>
                    }
                  >
                    {props?.devices?.audioInputs &&
                      props?.devices?.audioInputs?.length > 0 &&
                      props?.devices?.audioInputs.map((device) => (
                        <MenuItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </MenuItem>
                      ))}
                  </Select>
                </Grid>
              </Grid>

              {/* Speaker Section */}
              <Grid container sx={{ mt: 4 }}>
                <Grid size={12}>
                  <InputLabel sx={{ color: '#fff', mb: 1 }}>{t('Speaker')}</InputLabel>
                </Grid>
                <Grid size={12} sx={{ width: '100vw' }}>
                  <Select
                    autoFocus={props?.selectFocus === 'speaker'}
                    variant="outlined"
                    fullWidth
                    value={props?.selectedSpeaker || ''}
                    onChange={handleSpeakerChange}
                    sx={{ color: '#fff', width: '100%' }}
                    id="setting-dialog-speaker-select"
                    endAdornment={
                      <InputAdornment position="end" sx={{ mr: 2 }}>
                        <SvgIcon
                          size={24}
                          viewBox="0 0 500 500"
                          name={'audio-output'}
                          color={'#fff'}
                        />
                      </InputAdornment>
                    }
                  >
                    {props?.devices?.audioOutputs &&
                      props?.devices?.audioOutputs?.length > 0 &&
                      props?.devices?.audioOutputs.map((device) => (
                        <MenuItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </MenuItem>
                      ))}
                  </Select>
                </Grid>
              </Grid>

              {/* Noise Suppression Section */}
              {props?.onNoiseSuppressionToggle && (
                <Grid container sx={{ mt: 4 }}>
                  <Grid size={12} sx={{ width: '100vw' }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: `1px solid ${themeColors(theme).border}`,
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            id="setting-dialog-noise-suppression-label"
                            variant="body1"
                            sx={{ color: themeColors(theme).text, fontWeight: 'medium' }}
                          >
                            {t('Noise suppression')}
                          </Typography>
                          {noiseSuppressionNote && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                color: themeColors(theme).mutedText,
                              }}
                            >
                              {props?.noiseSuppressionStatus !== 'unavailable' && (
                                <Spinner size={12} />
                              )}
                              <Typography variant="caption">{noiseSuppressionNote}</Typography>
                            </Box>
                          )}
                        </Box>
                        <ToggleSwitch
                          id="setting-dialog-noise-suppression-switch"
                          checked={Boolean(props?.noiseSuppressionEnabled)}
                          disabled={!noiseSuppressionReady}
                          onChange={(event) =>
                            props?.onNoiseSuppressionToggle?.(event.target.checked)
                          }
                          inputProps={{
                            'aria-labelledby': 'setting-dialog-noise-suppression-label',
                          }}
                        />
                      </Box>

                      {props?.onNoiseSuppressionPercentChange && (
                        <Box sx={{ mt: 2, px: 1 }}>
                          <Typography
                            id="setting-dialog-noise-suppression-level-label"
                            variant="body2"
                            sx={{ color: themeColors(theme).mutedText }}
                          >
                            {t('Removes {{percent}}% of background noise', {
                              percent: shownPercent,
                            })}
                          </Typography>
                          <Slider
                            id="setting-dialog-noise-suppression-level"
                            min={MIN_NOISE_SUPPRESSION_PERCENT}
                            max={100}
                            step={5}
                            value={shownPercent}
                            disabled={!noiseSuppressionReady || !props?.noiseSuppressionEnabled}
                            marks={[
                              { value: MIN_NOISE_SUPPRESSION_PERCENT, label: t('Low') },
                              { value: 100, label: t('High') },
                            ]}
                            getAriaValueText={(value) =>
                              t('Removes {{percent}}% of background noise', { percent: value })
                            }
                            onChange={(_, value) => setDraftPercent(value as number)}
                            onChangeCommitted={(_, value) => {
                              setDraftPercent(null);
                              props?.onNoiseSuppressionPercentChange?.(value as number);
                            }}
                            slotProps={{
                              input: {
                                'aria-labelledby': 'setting-dialog-noise-suppression-label',
                              },
                            }}
                            sx={{ mt: 1 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: themeColors(theme).mutedText }}
                          >
                            {t(
                              'Higher levels remove more noise but can make your voice sound robotic.',
                            )}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Push-to-Talk Section */}
              <Grid container sx={{ mt: 4 }}>
                <Grid size={12} sx={{ width: '100vw' }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid grey',
                      width: '100%',
                    }}
                  >
                    <FormControlLabel
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'medium' }}>
                            {t('Push to Talk')}
                          </Typography>
                          <Tooltip title="Press and hold spacebar to unmute your mic">
                            {
                              //@ts-expect-error - legacy type mismatch, needs proper typing
                              <QuestionMarkRounded color={'#fff'} fontSize={'small'} />
                            }
                          </Tooltip>
                        </Box>
                      }
                      control={
                        <Switch
                          checked={localPushToTalkEnabled}
                          onChange={handlePushToTalkToggle}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#DADADA',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#DADADA',
                            },
                            '& .MuiSwitch-switchBase': {
                              color: '#DADADA', // Light gray thumb when unchecked
                            },
                            '& .MuiSwitch-track': {
                              backgroundColor: '#424242', // Dark gray track when unchecked
                            },
                          }}
                        />
                      }
                      sx={{ margin: 0, width: '100%' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
