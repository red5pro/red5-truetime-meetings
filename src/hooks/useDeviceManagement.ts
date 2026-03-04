// hooks/useDeviceManagement.ts
import { useState, useCallback, useEffect, useRef, MutableRefObject } from 'react';
import { isNull } from '../utils/utils';
import log from 'loglevel';

// Type definitions
interface MediaDeviceInfo {
  deviceId: string;
  kind: string;
  label: string;
}

interface DeviceList {
  audioInputs?: MediaDeviceInfo[];
  videoInputs?: MediaDeviceInfo[];
  audioOutputs?: MediaDeviceInfo[];
}

interface SelectedDevices {
  videoDeviceId?: string | null;
  audioDeviceId?: string | null;
  speakerDeviceId?: string | null;
}

interface DeviceAvailability {
  isVideoAvailable: boolean;
  isAudioAvailable: boolean;
}

interface Client {
  switchVideoDevice: (deviceId: string) => Promise<MediaStream>;
  switchAudioDevice: (deviceId: string) => Promise<MediaStream>;
  switchVideoCameraCapture: (streamId: string, deviceId: string) => void;
  switchAudioInputSource: (streamId: string, deviceId: string) => void;
  muteVideo: (muted: boolean) => Promise<void>;
}

interface RoomState {
  isPlayOnly: boolean;
  publishStreamIdRef: MutableRefObject<string | null>;
}

interface MediaControls {
  setCameraButtonDisabled: (disabled: boolean) => void;
  setMicrophoneButtonDisabled: (disabled: boolean) => void;
  setIsMyCamTurnedOff: (turnedOff: boolean) => void;
  toggleMic: (muted: boolean) => void;
}

interface UseDeviceManagementReturn {
  selectedCamera: string | null;
  selectedMicrophone: string | null;
  selectedSpeaker: string | null;
  devices: DeviceList;
  updateDevicesList: () => Promise<void>;
  cameraSelected: (value: string) => void;
  microphoneSelected: (value: string) => void;
  speakerSelected: (value: string) => Promise<void>;
  getSelectedDevices: () => SelectedDevices;
  setSelectedDevices: (devices: SelectedDevices) => void;
}

export const useDeviceManagement = (
  client: Client,
  roomState: RoomState,
  mediaControls: MediaControls,
  displayMessage: (message: string) => void,
): UseDeviceManagementReturn => {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(
    localStorage.getItem('selectedCamera'),
  );
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(
    localStorage.getItem('selectedMicrophone'),
  );
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(
    localStorage.getItem('selectedSpeaker'),
  );
  const [devices, setDevices] = useState<DeviceList>({});

  // Use refs to store latest values without triggering re-renders
  const displayMessageRef = useRef(displayMessage);
  const mediaControlsRef = useRef(mediaControls);
  const clientRef = useRef(client);
  const selectedCameraRef = useRef(selectedCamera);
  const selectedMicrophoneRef = useRef(selectedMicrophone);
  const selectedSpeakerRef = useRef(selectedSpeaker);
  const devicesRef = useRef(devices);

  // Keep refs up to date
  useEffect(() => {
    displayMessageRef.current = displayMessage;
  }, [displayMessage]);

  useEffect(() => {
    mediaControlsRef.current = mediaControls;
  }, [mediaControls]);

  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  useEffect(() => {
    selectedCameraRef.current = selectedCamera;
  }, [selectedCamera]);

  useEffect(() => {
    selectedMicrophoneRef.current = selectedMicrophone;
  }, [selectedMicrophone]);

  useEffect(() => {
    selectedSpeakerRef.current = selectedSpeaker;
  }, [selectedSpeaker]);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  const getSelectedDevices = useCallback(
    (): SelectedDevices => ({
      videoDeviceId: selectedCameraRef.current,
      audioDeviceId: selectedMicrophoneRef.current,
      speakerDeviceId: selectedSpeakerRef.current,
    }),
    [],
  );

  const setSelectedDevices = useCallback((devices: SelectedDevices): void => {
    if (!isNull(devices.videoDeviceId)) {
      setSelectedCamera(devices.videoDeviceId!);
      localStorage.setItem('selectedCamera', devices.videoDeviceId!);
    }
    if (!isNull(devices.audioDeviceId)) {
      setSelectedMicrophone(devices.audioDeviceId!);
      localStorage.setItem('selectedMicrophone', devices.audioDeviceId!);
    }
    if (!isNull(devices.speakerDeviceId)) {
      setSelectedSpeaker(devices.speakerDeviceId!);
      localStorage.setItem('selectedSpeaker', devices.speakerDeviceId!);
    }
  }, []);

  const updateDevicesList = useCallback(async (): Promise<void> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const deviceList: DeviceList = {
        audioInputs: devices.filter((device) => device.kind === 'audioinput'),
        videoInputs: devices.filter((device) => device.kind === 'videoinput'),
        audioOutputs: devices.filter((device) => device.kind === 'audiooutput'),
      };
      setDevices(deviceList);
    } catch (error) {
      log.error('Error getting device list:', error);
    }
  }, []);

  const cameraSelected = useCallback(
    (value: string): void => {
      setSelectedDevices({ videoDeviceId: value });
      try {
        clientRef.current.switchVideoDevice(value).then((mediaStream) => {
          if (mediaStream) {
            const tempLocalVideo = document.getElementById('red5pro-publisher') as HTMLVideoElement;
            if (tempLocalVideo) tempLocalVideo.srcObject = mediaStream;
          }
        });
      } catch (e) {
        log.error('Failed to switch camera:', e);
      }
    },
    [setSelectedDevices],
  );

  const microphoneSelected = useCallback(
    (value: string): void => {
      setSelectedDevices({ audioDeviceId: value });
      try {
        clientRef.current.switchAudioDevice(value).then((mediaStream) => {
          if (mediaStream) {
            const tempLocalVideo = document.getElementById('red5pro-publisher') as HTMLVideoElement;
            if (tempLocalVideo) tempLocalVideo.srcObject = mediaStream;
          }
        });
      } catch (e) {
        log.error('Failed to switch microphone:', e);
      }
    },
    [setSelectedDevices],
  );

  const speakerSelected = useCallback(
    async (value: string): Promise<void> => {
      let speaker = value;
      if (speaker) {
        setSelectedDevices({ speakerDeviceId: speaker });
      } else {
        speaker = selectedSpeakerRef.current || '';
      }

      try {
        // Find all audio elements that need speaker output switching
        const audioElements = [
          document.getElementById('red5pro-publisher'), // Local publisher video
          ...Array.from(document.querySelectorAll('video[id^="red5pro-subscriber-"]')), // All subscriber video elements
          ...Array.from(document.querySelectorAll('audio[id^="red5pro-subscriber-"]')), // All subscriber audio elements
        ].filter(Boolean) as (HTMLVideoElement | HTMLAudioElement)[];

        // Switch speaker output for each audio/video element
        for (const element of audioElements) {
          if ('setSinkId' in element && typeof element.setSinkId === 'function') {
            try {
              console.log('Sink ID device', speaker);
              await element.setSinkId(speaker);
              log.info(
                `Successfully switched speaker output for element ${element.id || 'unnamed'} to device: ${speaker}`,
              );
            } catch (sinkError) {
              log.warn(
                `Failed to set speaker output for element ${element.id || 'unnamed'}:`,
                sinkError,
              );
              // Continue with other elements even if one fails
            }
          } else {
            log.warn(`setSinkId not supported for element ${element.id || 'unnamed'}`);
          }
        }
      } catch (error) {
        log.error('Failed to switch speaker:', error);
        displayMessageRef.current('Failed to switch speaker output. Please try again.');
      }
    },
    [setSelectedDevices],
  );

  // Helper function to get device name for display
  // @ts-expect-error: temporary fix for legacy code
  const getDeviceName = (deviceId: string | null, deviceType: keyof DeviceList): string => {
    if (!deviceId || deviceId === 'default') return 'Default';

    const deviceList = devicesRef.current[deviceType] || [];
    const device = deviceList.find((d) => d.deviceId === deviceId);
    return device ? device.label || `${deviceType} Device` : 'Unknown Device';
  };

  const checkAndUpdateVideoAudioSources = useCallback((): void => {
    if (roomState.isPlayOnly) {
      log.info('Play only mode is active, no need to check and update video audio sources.');
      return;
    }

    const selectedDevices = getSelectedDevices();
    const previousVideoDeviceId = selectedDevices.videoDeviceId;
    const previousAudioDeviceId = selectedDevices.audioDeviceId;

    // Check device availability and update UI
    const deviceAvailability = checkDeviceAvailability(selectedDevices);
    updateMediaControlsBasedOnAvailability(deviceAvailability);

    // Handle unavailable or missing devices
    const updatedDevices = handleUnavailableDevices(selectedDevices, deviceAvailability);

    // Update selected devices if changes were made
    if (hasDevicesChanged(selectedDevices, updatedDevices)) {
      setSelectedDevices(updatedDevices);
    }

    // Switch media sources if devices changed
    switchMediaSourcesIfNeeded(previousVideoDeviceId, previousAudioDeviceId, updatedDevices);
  }, [roomState.isPlayOnly, getSelectedDevices, setSelectedDevices]);

  // Helper functions
  const checkDeviceAvailability = (selectedDevices: SelectedDevices): DeviceAvailability => {
    const videoDevice = devicesRef.current.videoInputs?.find(
      (d) => d.deviceId === selectedDevices.videoDeviceId,
    );
    const audioDevice = devicesRef.current.audioInputs?.find(
      (d) => d.deviceId === selectedDevices.audioDeviceId,
    );

    return {
      isVideoAvailable: Boolean(videoDevice),
      isAudioAvailable: Boolean(audioDevice),
    };
  };

  const updateMediaControlsBasedOnAvailability = ({
    isVideoAvailable,
    isAudioAvailable,
  }: DeviceAvailability): void => {
    if (isVideoAvailable) {
      mediaControlsRef.current.setCameraButtonDisabled(false);
    }
    if (isAudioAvailable) {
      mediaControlsRef.current.setMicrophoneButtonDisabled(false);
    }
  };

  const handleUnavailableDevices = (
    selectedDevices: SelectedDevices,
    { isVideoAvailable, isAudioAvailable }: DeviceAvailability,
  ): SelectedDevices => {
    const updatedDevices = { ...selectedDevices };

    // Handle video device
    if (!selectedDevices.videoDeviceId || !isVideoAvailable) {
      updatedDevices.videoDeviceId = handleUnavailableVideoDevice();
    }

    // Handle audio device
    if (!selectedDevices.audioDeviceId || !isAudioAvailable) {
      updatedDevices.audioDeviceId = handleUnavailableAudioDevice();
    }

    return updatedDevices;
  };

  const handleUnavailableVideoDevice = (): string => {
    const availableCamera = devicesRef.current.videoInputs?.[0];

    if (availableCamera) {
      mediaControlsRef.current.setCameraButtonDisabled(false);
      log.info('Unable to access selected camera, switching to first available camera.');
      displayMessageRef.current(
        'Unable to access selected camera, switching to first available camera.',
      );
      return availableCamera.deviceId;
    } else {
      // No camera available - disable video
      clientRef.current
        .muteVideo(true)
        .then(() => mediaControlsRef.current.setIsMyCamTurnedOff(true));
      mediaControlsRef.current.setCameraButtonDisabled(true);
      log.info('No camera device available.');
      displayMessageRef.current('No camera device available.');
      return '';
    }
  };

  const handleUnavailableAudioDevice = (): string => {
    const availableAudio = devicesRef.current.audioInputs?.[0];

    if (availableAudio) {
      mediaControlsRef.current.setMicrophoneButtonDisabled(false);
      log.info('Unable to access selected microphone, switching to first available microphone.');
      displayMessageRef.current(
        'Unable to access selected microphone, switching to first available microphone.',
      );
      return availableAudio.deviceId;
    } else {
      // No microphone available - disable audio
      mediaControlsRef.current.toggleMic(true);
      mediaControlsRef.current.setMicrophoneButtonDisabled(true);
      log.info('No microphone device available.');
      displayMessageRef.current('No microphone device available.');
      return '';
    }
  };

  const hasDevicesChanged = (original: SelectedDevices, updated: SelectedDevices): boolean => {
    return (
      original.videoDeviceId !== updated.videoDeviceId ||
      original.audioDeviceId !== updated.audioDeviceId
    );
  };

  const switchMediaSourcesIfNeeded = (
    previousVideoId: string | null | undefined,
    previousAudioId: string | null | undefined,
    currentDevices: SelectedDevices,
  ): void => {
    if (!roomState.publishStreamIdRef.current) {
      return;
    }

    try {
      // Switch video source if changed
      if (previousVideoId !== currentDevices.videoDeviceId && currentDevices.videoDeviceId) {
        clientRef.current.switchVideoCameraCapture(
          roomState.publishStreamIdRef.current,
          currentDevices.videoDeviceId,
        );
      }

      // Switch audio source if changed or using default
      const shouldSwitchAudio =
        previousAudioId !== currentDevices.audioDeviceId ||
        currentDevices.audioDeviceId === 'default';

      if (shouldSwitchAudio && currentDevices.audioDeviceId) {
        clientRef.current.switchAudioInputSource(
          roomState.publishStreamIdRef.current,
          currentDevices.audioDeviceId,
        );
      }
    } catch (error) {
      log.error('Error while switching video/audio sources', error);
    }
  };

  useEffect(() => {
    if (devices.audioInputs?.length || devices.videoInputs?.length) {
      checkAndUpdateVideoAudioSources();
    }
  }, [devices, checkAndUpdateVideoAudioSources]);

  return {
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    devices,
    updateDevicesList,
    cameraSelected,
    microphoneSelected,
    speakerSelected,
    getSelectedDevices,
    setSelectedDevices,
  };
};
