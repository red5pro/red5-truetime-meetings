import React, { useState, useCallback, useEffect, useRef, ReactNode, MouseEvent } from 'react';
import {
  Box,
  Button,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  VolumeUp,
  Check,
  ExpandMore,
  BarChart,
} from '@mui/icons-material';
import { isMobile } from 'react-device-detect';

// Interfaces
interface Device {
  deviceId: string;
  label: string;
  kind: string;
}

export interface Devices {
  videoInputs?: Device[];
  audioInputs?: Device[];
  audioOutputs?: Device[];
}

interface DeviceSelectorProps {
  devices: Devices;
  selectedCamera?: string;
  selectedMicrophone?: string;
  selectedSpeaker?: string;
  onCameraChange?: (deviceId: string) => void;
  onMicrophoneChange?: (deviceId: string) => void;
  onSpeakerChange?: (deviceId: string) => void;
  isCameraOn?: boolean;
  isMicOn?: boolean;
}

interface DeviceButtonProps {
  icon: ReactNode;
  label: string;
  selectedDevice: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

// Extend Window interface for AudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  selectedCamera,
  selectedMicrophone,
  selectedSpeaker,
  onCameraChange,
  onMicrophoneChange,
  onSpeakerChange,
  isCameraOn = true,
  isMicOn = true,
}) => {
  const [cameraMenuAnchor, setCameraMenuAnchor] = useState<HTMLElement | null>(null);
  const [micMenuAnchor, setMicMenuAnchor] = useState<HTMLElement | null>(null);
  const [speakerMenuAnchor, setSpeakerMenuAnchor] = useState<HTMLElement | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [selectedFacingMode, setSelectedFacingMode] = useState<'user' | 'environment' | null>(null);

  const mobileCameraOptions = [
    { id: 'facingMode:user', label: 'Front Camera', facingMode: 'user' as const },
    { id: 'facingMode:environment', label: 'Back Camera', facingMode: 'environment' as const },
  ];

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize default selections
  useEffect(() => {
    if (!selectedCamera && devices.videoInputs?.length && devices.videoInputs.length > 0) {
      onCameraChange?.(devices.videoInputs[0].deviceId);
    } else if (selectedCamera) {
      onCameraChange?.(selectedCamera);
    }
    if (!selectedMicrophone && devices.audioInputs?.length && devices.audioInputs.length > 0) {
      onMicrophoneChange?.(devices.audioInputs[0].deviceId);
    } else if (selectedMicrophone) {
      onMicrophoneChange?.(selectedMicrophone);
    }
    if (!selectedSpeaker && devices.audioOutputs?.length && devices.audioOutputs.length > 0) {
      onSpeakerChange?.(devices.audioOutputs[0].deviceId);
    } else if (selectedSpeaker) {
      onSpeakerChange?.(selectedSpeaker);
    }
  }, [
    devices,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    onCameraChange,
    onMicrophoneChange,
    onSpeakerChange,
  ]);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback(async (): Promise<void> => {
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicrophone ? { deviceId: selectedMicrophone } : true,
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
  }, [selectedMicrophone]);

  const stopAudioLevelMonitoring = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setAudioLevel(0);
  }, []);

  // Start/stop audio monitoring when microphone menu opens/closes
  useEffect(() => {
    if (Boolean(micMenuAnchor) && isMicOn) {
      startAudioLevelMonitoring();
    } else {
      stopAudioLevelMonitoring();
    }

    return () => stopAudioLevelMonitoring();
  }, [micMenuAnchor, isMicOn, startAudioLevelMonitoring, stopAudioLevelMonitoring]);

  const handleCameraMenuOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setCameraMenuAnchor(event.currentTarget);
  }, []);

  const handleMicMenuOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setMicMenuAnchor(event.currentTarget);
  }, []);

  const handleSpeakerMenuOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setSpeakerMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback((): void => {
    setCameraMenuAnchor(null);
    setMicMenuAnchor(null);
    setSpeakerMenuAnchor(null);
  }, []);

  const handleCameraSelect = useCallback(
    (deviceId: string) => {
      if (deviceId.startsWith('facingMode:')) {
        const facingMode = deviceId.split(':')[1] as 'user' | 'environment';
        setSelectedFacingMode(facingMode);
      }
      onCameraChange?.(deviceId);
      handleMenuClose();
    },
    [onCameraChange, handleMenuClose],
  );

  const handleMicrophoneSelect = useCallback(
    (deviceId: string) => {
      onMicrophoneChange?.(deviceId);
      handleMenuClose();
    },
    [onMicrophoneChange, handleMenuClose],
  );

  const handleSpeakerSelect = useCallback(
    (deviceId: string) => {
      onSpeakerChange?.(deviceId);
      handleMenuClose();
    },
    [onSpeakerChange, handleMenuClose],
  );

  const getSelectedDeviceName = (deviceList?: Device[], selectedId?: string): string => {
    const device = deviceList?.find((d) => d.deviceId === selectedId);
    return device?.label || 'No device selected';
  };

  const DeviceButton: React.FC<DeviceButtonProps> = ({
    icon,
    selectedDevice,
    onClick,
    disabled = false,
  }) => (
    <Button
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      sx={{
        minWidth: { xs: '20vw', sm: '15vw', md: '12vw', lg: '10vw' },
        maxWidth: { xs: '25vw', sm: '18vw', md: '15vw', lg: '13vw' },
        justifyContent: 'space-between',
        textTransform: 'none',
        color: 'white',
        borderColor: alpha('#fff', 0.3),
        backgroundColor: alpha('#000', 0.2),
        backdropFilter: 'blur(10px)',
        '&:hover': {
          borderColor: alpha('#fff', 0.5),
          backgroundColor: alpha('#000', 0.3),
        },
        '&:disabled': {
          color: alpha('#fff', 0.5),
          borderColor: alpha('#fff', 0.2),
        },
      }}
      startIcon={icon}
      endIcon={<ExpandMore />}
    >
      <Box
        sx={{
          flex: 1,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mx: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedDevice}
        </Typography>
      </Box>
    </Button>
  );

  // Common menu props with disablePortal and high z-index
  const getMenuProps = (anchorEl: HTMLElement | null) => ({
    anchorEl: anchorEl,
    open: Boolean(anchorEl),
    onClose: handleMenuClose,
    anchorOrigin: {
      vertical: 'bottom' as const,
      horizontal: 'center' as const,
    },
    transformOrigin: {
      vertical: 'top' as const,
      horizontal: 'center' as const,
    },
    disablePortal: true,
    sx: {
      zIndex: 9999,
    },
    PaperProps: {
      sx: {
        width: 'auto',
        backgroundColor: alpha('#000', 0.9),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha('#fff', 0.1)}`,
        maxHeight: 300,
        minWidth: anchorEl?.offsetWidth || 200,
        mt: 1,
        zIndex: 9999,
        position: 'relative',
        '& .MuiMenuItem-root': {
          color: 'white',
          '&:hover': {
            backgroundColor: alpha('#fff', 0.1),
          },
        },
      },
    },
    MenuListProps: {
      sx: {
        py: 0,
      },
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        position: 'relative',
        zIndex: 1000,
        p: 2,
        backgroundColor: alpha('#000', 0.1),
        backdropFilter: 'blur(20px)',
        borderRadius: 2,
        border: `1px solid ${alpha('#fff', 0.1)}`,
        width: { xs: '100%', sm: 'fit-content' },
        maxWidth: '100%',
        flexWrap: 'wrap',
      }}
    >
      {/* Camera Selector */}
      <DeviceButton
        icon={isCameraOn ? <Videocam /> : <VideocamOff />}
        label="Camera"
        selectedDevice={getSelectedDeviceName(devices.videoInputs, selectedCamera)}
        onClick={handleCameraMenuOpen}
        disabled={devices.videoInputs?.length === 0}
      />

      {/* Microphone Selector */}
      <DeviceButton
        icon={isMicOn ? <Mic /> : <MicOff />}
        label="Microphone"
        selectedDevice={getSelectedDeviceName(devices.audioInputs, selectedMicrophone)}
        onClick={handleMicMenuOpen}
        disabled={devices.audioInputs?.length === 0}
      />

      {/* Speaker Selector */}
      <DeviceButton
        icon={<VolumeUp />}
        label="Speaker"
        selectedDevice={getSelectedDeviceName(devices.audioOutputs, selectedSpeaker)}
        onClick={handleSpeakerMenuOpen}
        disabled={devices.audioOutputs?.length === 0}
      />

      {/* Camera Menu */}
      <Menu {...getMenuProps(cameraMenuAnchor)}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: alpha('#fff', 0.7) }}>
          Select Camera
        </Typography>
        <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />
        {isMobile
          ? mobileCameraOptions.map((option) => (
              <MenuItem
                key={option.id}
                onClick={() => handleCameraSelect(option.id)}
                selected={selectedFacingMode === option.facingMode}
              >
                <ListItemIcon>
                  {selectedFacingMode === option.facingMode ? (
                    <Check sx={{ color: '#4CAF50' }} />
                  ) : (
                    <Videocam sx={{ color: alpha('#fff', 0.7) }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={option.label}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </MenuItem>
            ))
          : devices.videoInputs?.map((device) => (
              <MenuItem
                key={device.deviceId}
                onClick={() => handleCameraSelect(device.deviceId)}
                selected={selectedCamera === device.deviceId}
              >
                <ListItemIcon>
                  {selectedCamera === device.deviceId ? (
                    <Check sx={{ color: '#4CAF50' }} />
                  ) : (
                    <Videocam sx={{ color: alpha('#fff', 0.7) }} />
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
            ))}
      </Menu>

      {/* Microphone Menu */}
      <Menu {...getMenuProps(micMenuAnchor)}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: alpha('#fff', 0.7) }}>
          Select Microphone
        </Typography>
        <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />
        {devices.audioInputs?.map((device) => (
          <MenuItem
            key={device.deviceId}
            onClick={() => handleMicrophoneSelect(device.deviceId)}
            selected={selectedMicrophone === device.deviceId}
          >
            <ListItemIcon>
              {selectedMicrophone === device.deviceId ? (
                <Check sx={{ color: '#4CAF50' }} />
              ) : (
                <Mic sx={{ color: alpha('#fff', 0.7) }} />
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
        ))}
        <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />
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
            <BarChart sx={{ color: alpha('#fff', 0.7) }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Audio Level
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={audioLevel}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha('#fff', 0.1),
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
                    color: alpha('#fff', 0.6),
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

      {/* Speaker Menu */}
      <Menu {...getMenuProps(speakerMenuAnchor)}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: alpha('#fff', 0.7) }}>
          Select Speaker
        </Typography>
        <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />
        {devices.audioOutputs?.map((device) => (
          <MenuItem
            key={device.deviceId}
            onClick={() => handleSpeakerSelect(device.deviceId)}
            selected={selectedSpeaker === device.deviceId}
          >
            <ListItemIcon>
              {selectedSpeaker === device.deviceId ? (
                <Check sx={{ color: '#4CAF50' }} />
              ) : (
                <VolumeUp sx={{ color: alpha('#fff', 0.7) }} />
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
        ))}
      </Menu>
    </Box>
  );
};

export default DeviceSelector;
