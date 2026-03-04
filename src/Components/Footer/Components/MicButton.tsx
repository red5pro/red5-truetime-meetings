import React, { MouseEvent, useState, useEffect, useRef, useCallback } from 'react';
import { SvgIcon } from '../../SvgIcon';
import { useSnackbar } from 'notistack';
import {
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  LinearProgress,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Check, BarChart } from '@mui/icons-material';
// @ts-ignore
import { CustomizedBtn, rectangularStyle } from '../../CustomizedBtn.tsx';
import { Box } from '@mui/system';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface Device {
  deviceId: string;
  label: string;
  kind: string;
}

interface MicButtonProps {
  glass?: boolean;
  footer?: boolean;
  isMicMuted?: boolean;
  microphoneButtonDisabled?: boolean;
  toggleMic?: (muted: boolean) => void;
  rounded?: boolean;
  // New props for device selection
  audioInputs?: Device[];
  selectedMicrophone?: string;
  onMicrophoneChange?: (deviceId: string) => void;
  showMicrophoneOptions?: boolean; // Flag to show/hide dropdown button (default: true)
}

// Extend Window interface for AudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function MicButton(props: MicButtonProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const theme = useTheme();
  const [_, setHovered] = React.useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const open = Boolean(anchorEl);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Default showMicrophoneOptions to true if not specified
  const showMicrophoneOptions = props.showMicrophoneOptions !== false;

  // Initialize default microphone selection
  useEffect(() => {
    if (!props.selectedMicrophone && props.audioInputs && props.audioInputs.length > 0) {
      props.onMicrophoneChange?.(props.audioInputs[0].deviceId);
    }
  }, [props.audioInputs, props.selectedMicrophone, props.onMicrophoneChange]);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback(async (): Promise<void> => {
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: props.selectedMicrophone ? { deviceId: props.selectedMicrophone } : true,
      });

      micStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext!)();
      analyserRef.current = audioContextRef.current.createAnalyser();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioLevel = (): void => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setAudioLevel(0);
    }
  }, [props.selectedMicrophone]);

  const stopAudioLevelMonitoring = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  }, []);

  // Start/stop audio monitoring when menu opens/closes
  useEffect(() => {
    if (open && !props.isMicMuted) {
      startAudioLevelMonitoring();
    } else {
      stopAudioLevelMonitoring();
    }

    return () => stopAudioLevelMonitoring();
  }, [open, props.isMicMuted, startAudioLevelMonitoring, stopAudioLevelMonitoring]);

  const handleMicToggle = (e: MouseEvent<HTMLButtonElement>, mute: boolean) => {
    e.stopPropagation();

    const notificationContent = (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SvgIcon
          size={14}
          viewBox="0 0 500 500"
          name={mute ? 'muted-microphone' : 'microphone'}
          color={theme.palette.themeColor[99]}
        />
        {mute ? t('Microphone on') : t('Microphone off')}
      </Box>
    );

    enqueueSnackbar(notificationContent, {
      variant: 'info',
      autoHideDuration: 1500,
    });

    props?.toggleMic?.(!mute);
  };

  const handleMenuOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMicrophoneSelect = (deviceId: string) => {
    props.onMicrophoneChange?.(deviceId);
    // Don't close menu immediately to allow seeing audio level change
    // User can click outside or select another option to close
  };

  const getIconColor = (): string => {
    return theme.palette.themeColor[99];
  };

  const getButtonColor = (): 'primary' | 'secondary' | 'error' => {
    if (props?.microphoneButtonDisabled) {
      return 'secondary';
    }
    return props?.isMicMuted ? 'error' : 'secondary';
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.12 }}>
      {/* Main Microphone Button */}
      <Tooltip
        title={t(props?.isMicMuted ? 'Turn on microphone' : 'Turn off microphone')}
        placement="top"
      >
        <CustomizedBtn
          id="mic-button"
          glass={props?.glass}
          disabled={props?.microphoneButtonDisabled}
          className={props?.footer ? 'footer-icon-button' : ''}
          variant="contained"
          sx={{
            ...rectangularStyle,
            // Only adjust border radius if dropdown is shown
            ...(showMicrophoneOptions && {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }),
          }}
          color={getButtonColor()}
          onClick={(e: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) =>
            handleMicToggle(e, props?.isMicMuted || false)
          }
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <SvgIcon
            size={24}
            viewBox="0 0 500 500"
            name={props?.isMicMuted ? 'muted-microphone' : 'microphone'}
            color={getIconColor()}
          />
        </CustomizedBtn>
      </Tooltip>

      {/* Dropdown Arrow Button - conditionally rendered */}
      {showMicrophoneOptions && (
        <>
          <Tooltip title={t('Microphone options')} placement="top">
            <CustomizedBtn
              id="mic-menu-button"
              glass={props?.glass}
              className={props?.footer ? 'footer-icon-button' : ''}
              variant="contained"
              color={getButtonColor()}
              sx={{
                width: { xs: 32, md: 40 },
                height: { xs: 46, md: 56 },
                minWidth: { xs: 32, md: 40 },
                minHeight: { xs: 46, md: 56 },
                maxWidth: { xs: 32, md: 40 },
                maxHeight: { xs: 46, md: 56 },
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: '12px',
                borderBottomRightRadius: '12px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              disabled={props?.microphoneButtonDisabled}
              onClick={handleMenuOpen}
              aria-controls={open ? 'mic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 20,
                  color: getIconColor(),
                  transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </CustomizedBtn>
          </Tooltip>

          {/* Popup Menu with Microphone Device Selection */}
          <Menu
            id="mic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'mic-menu-button',
            }}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                minWidth: 250,
                maxWidth: 400,
              },
            }}
          >
            {/* Microphone Selection Section */}
            <Typography
              variant="subtitle2"
              sx={{
                px: 2,
                py: 1,
                color: theme.palette.text.secondary,
                fontWeight: 600,
              }}
            >
              {t('Select Microphone')}
            </Typography>
            <Divider />

            {props.audioInputs && props.audioInputs.length > 0 ? (
              props.audioInputs.map((device) => (
                <MenuItem
                  key={device.deviceId}
                  onClick={() => handleMicrophoneSelect(device.deviceId)}
                  selected={props.selectedMicrophone === device.deviceId}
                >
                  <ListItemIcon>
                    {props.selectedMicrophone === device.deviceId ? (
                      <Check sx={{ color: '#4CAF50' }} />
                    ) : (
                      <SvgIcon
                        size={20}
                        viewBox="0 0 500 500"
                        name="microphone"
                        color={theme.palette.text.secondary}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={device.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <ListItemText primary={t('No microphones available')} />
              </MenuItem>
            )}

            <Divider />

            {/* Audio Level Indicator */}
            <MenuItem
              disabled
              sx={{
                opacity: 1,
                '&.Mui-disabled': {
                  opacity: 1,
                },
              }}
            >
              <ListItemIcon>
                <BarChart sx={{ color: theme.palette.text.secondary }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t('Audio Level')}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={audioLevel}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.text.primary, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor:
                            audioLevel > 80 ? '#f44336' : audioLevel > 50 ? '#ff9800' : '#4caf50',
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        mt: 0.5,
                        display: 'block',
                      }}
                    >
                      {Math.round(audioLevel)}%
                    </Typography>
                  </Box>
                }
              />
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
}

export default MicButton;
