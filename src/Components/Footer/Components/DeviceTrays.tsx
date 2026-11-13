import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import {
  MicNone,
  NoiseAware,
  SettingsOutlined,
  VideocamOutlined,
  VolumeUp,
  AutoAwesome,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { isMobile } from 'react-device-detect';
import {
  AudioMeter,
  DeviceMenuButton,
  Spinner,
  ToolbarButton,
  type DeviceOption,
} from 'truetime-ui';
import type { NoiseSuppressionStatus } from '../../../hooks/useNoiseSuppression';

interface Device {
  deviceId: string;
  label: string;
  kind: string;
}

const toOptions = (devices?: Device[]): DeviceOption[] =>
  (devices ?? []).map((device) => ({ value: device.deviceId, label: device.label }));

/**
 * The selected microphone, captured only while `active` (the microphone list is open), so the
 * list can show its level without the call's audio pipeline.
 */
function useMicPreviewStream(active: boolean, deviceId?: string): MediaStream | null {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!active || !navigator.mediaDevices?.getUserMedia) return;
    let cancelled = false;
    let captured: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true })
      .then((next) => {
        if (cancelled) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        captured = next;
        setStream(next);
      })
      .catch(() => setStream(null));
    return () => {
      cancelled = true;
      captured?.getTracks().forEach((track) => track.stop());
      setStream(null);
    };
  }, [active, deviceId]);

  return stream;
}

interface CameraTrayProps {
  videoInputs?: Device[];
  selectedCamera?: string;
  onCameraChange?: (deviceId: string) => void;
  onOpenEffects?: () => void;
  onOpenSettings?: () => void;
}

/** Camera options shown above the call controls: device, effects and settings. */
export function CameraTray(props: CameraTrayProps) {
  const { t } = useTranslation();
  const [facingMode, setFacingMode] = useState<string | undefined>();

  const options: DeviceOption[] = isMobile
    ? [
        { value: 'facingMode:user', label: t('Front Camera') },
        { value: 'facingMode:environment', label: t('Back Camera') },
      ]
    : toOptions(props.videoInputs);

  const handleChange = (value: string) => {
    if (value.startsWith('facingMode:')) setFacingMode(value);
    props.onCameraChange?.(value);
  };

  return (
    <>
      <DeviceMenuButton
        id="camera-device-select"
        icon={<VideocamOutlined />}
        label={t('Camera')}
        options={options}
        value={isMobile ? facingMode : props.selectedCamera}
        onChange={handleChange}
        emptyText={t('No cameras available')}
        sx={{ flex: '1 1 160px', maxWidth: 240 }}
      />
      {!isMobile && (
        <ToolbarButton
          id="backgrounds-and-effects-button"
          size="chip"
          icon={<AutoAwesome />}
          label={t('Backgrounds and effects')}
          onClick={props.onOpenEffects}
        >
          {t('Backgrounds and effects')}
        </ToolbarButton>
      )}
      <ToolbarButton
        size="chip"
        tone="ghost"
        icon={<SettingsOutlined />}
        label={t('Video settings')}
        onClick={props.onOpenSettings}
      />
    </>
  );
}

interface MicTrayProps {
  audioInputs?: Device[];
  audioOutputs?: Device[];
  selectedMicrophone?: string;
  onMicrophoneChange?: (deviceId: string) => void;
  selectedSpeaker?: string;
  onSpeakerChange?: (deviceId: string) => void;
  isMicMuted?: boolean;
  noiseSuppressionEnabled?: boolean;
  noiseSuppressionStatus?: NoiseSuppressionStatus;
  onNoiseSuppressionChange?: (enabled: boolean) => void;
  onOpenSettings?: () => void;
}

/** Audio options shown above the call controls: microphone, speaker, noise suppression, settings. */
export function MicTray(props: MicTrayProps) {
  const { t } = useTranslation();
  const [micListOpen, setMicListOpen] = useState(false);
  const previewStream = useMicPreviewStream(
    micListOpen && !props.isMicMuted,
    props.selectedMicrophone,
  );

  const noiseReady = props.noiseSuppressionStatus === 'ready';
  const noiseNote =
    props.noiseSuppressionStatus === 'unavailable'
      ? t('Not available')
      : noiseReady
        ? null
        : props.noiseSuppressionStatus === 'downloading'
          ? t('Downloading…')
          : t('Initializing…');
  const noiseLoading = !noiseReady && props.noiseSuppressionStatus !== 'unavailable';

  return (
    <>
      <DeviceMenuButton
        id="microphone-device-select"
        icon={<MicNone />}
        label={t('Microphone')}
        options={toOptions(props.audioInputs)}
        value={props.selectedMicrophone}
        onChange={(value) => props.onMicrophoneChange?.(value)}
        emptyText={t('No microphones available')}
        onOpenChange={setMicListOpen}
        menuFooter={
          previewStream ? (
            <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
              <AudioMeter
                stream={previewStream}
                orientation="horizontal"
                length="100%"
                thickness={6}
                label={t('Audio Level')}
              />
            </Box>
          ) : null
        }
        sx={{ flex: '1 1 160px', maxWidth: 220 }}
      />
      {(props.audioOutputs?.length ?? 0) > 0 && (
        <DeviceMenuButton
          id="speaker-device-select"
          icon={<VolumeUp />}
          label={t('Speaker')}
          options={toOptions(props.audioOutputs)}
          value={props.selectedSpeaker}
          onChange={(value) => props.onSpeakerChange?.(value)}
          sx={{ flex: '1 1 160px', maxWidth: 220 }}
        />
      )}
      {props.onNoiseSuppressionChange && (
        <ToolbarButton
          id="noise-suppression-button"
          size="chip"
          icon={noiseLoading ? <Spinner size={16} /> : <NoiseAware />}
          label={t('Noise suppression')}
          title={noiseNote ?? undefined}
          pressed={Boolean(props.noiseSuppressionEnabled)}
          tone={props.noiseSuppressionEnabled && noiseReady ? 'active' : 'default'}
          disabled={!noiseReady}
          onClick={() => props.onNoiseSuppressionChange?.(!props.noiseSuppressionEnabled)}
        >
          {noiseNote ? `${t('Noise suppression')} · ${noiseNote}` : t('Noise suppression')}
        </ToolbarButton>
      )}
      <ToolbarButton
        size="chip"
        tone="ghost"
        icon={<SettingsOutlined />}
        label={t('Audio settings')}
        onClick={props.onOpenSettings}
      />
    </>
  );
}
