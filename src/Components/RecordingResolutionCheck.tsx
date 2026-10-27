import React from 'react';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { Alert, Button, FormField, Select, Text } from 'truetime-ui';
import type { RecordingSources } from '../hooks/useRecording';
import {
  RESOLUTION_PRESETS,
  formatResolution,
  type ResolutionPreset,
} from '../utils/recordingResolution';

const PRESET_OPTIONS: { value: ResolutionPreset; label: string }[] = [
  { value: '720p', label: '720p (1280×720)' },
  { value: '1080p', label: '1080p (1920×1080)' },
];

interface RecordingResolutionCheckProps {
  open: boolean;
  preset: ResolutionPreset;
  onPresetChange: (preset: ResolutionPreset) => void;
  applyResolution: (
    preset: ResolutionPreset,
    options?: { raiseCamera?: boolean },
  ) => Promise<RecordingSources>;
}

/**
 * Shows the resolution the local recording will actually capture (the combined file, the
 * local camera and each remote feed) and lets the user raise the local camera before
 * recording. Starting without changes records at the current resolution.
 */
export function RecordingResolutionCheck({
  open,
  preset,
  onPresetChange,
  applyResolution,
}: RecordingResolutionCheckProps) {
  const { t } = useTranslation();
  const [sources, setSources] = React.useState<RecordingSources | null>(null);
  const [raising, setRaising] = React.useState(false);
  // Preset the camera was last raised to; the offer comes back when the preset changes
  const [raisedFor, setRaisedFor] = React.useState<ResolutionPreset | null>(null);
  const raiseAttempted = raisedFor === preset;

  React.useEffect(() => {
    if (!open) return;
    applyResolution(preset).then(setSources);
  }, [open, preset, applyResolution]);

  const target = RESOLUTION_PRESETS[preset];
  const camera = sources?.camera ?? null;
  const cameraBelowTarget = !!camera && camera.height < target.height;
  const remotesBelowTarget = (sources?.remotes ?? []).filter(
    (r) => r.resolution && r.resolution.height < target.height,
  );

  const raiseCamera = async () => {
    setRaising(true);
    try {
      setSources(await applyResolution(preset, { raiseCamera: true }));
    } finally {
      setRaisedFor(preset);
      setRaising(false);
    }
  };

  return (
    <Box sx={{ mt: 1.5, pl: 4 }}>
      <FormField label={t('Recording resolution')} fullWidth>
        <Select value={preset} options={PRESET_OPTIONS} onChange={onPresetChange} fullWidth />
      </FormField>

      <Box
        component="dl"
        sx={{
          m: 0,
          mt: 1.5,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 2,
          rowGap: 0.5,
        }}
      >
        <Text component="dt" variant="body2" tone="muted">
          {t('Combined file')}
        </Text>
        <Text component="dd" variant="body2" mono sx={{ m: 0 }}>
          {formatResolution(sources?.composite ?? null)}
        </Text>
        <Text component="dt" variant="body2" tone="muted">
          {t('Your camera')}
        </Text>
        <Text component="dd" variant="body2" mono sx={{ m: 0 }}>
          {camera ? formatResolution(camera) : t('Camera off')}
        </Text>
        {sources?.remotes.map((remote) => (
          <React.Fragment key={remote.id}>
            <Text component="dt" variant="body2" tone="muted">
              {remote.name}
            </Text>
            <Text component="dd" variant="body2" mono sx={{ m: 0 }}>
              {remote.resolution ? formatResolution(remote.resolution) : t('Camera off')}
            </Text>
          </React.Fragment>
        ))}
      </Box>

      {cameraBelowTarget && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          <Text variant="body2">
            {raiseAttempted
              ? t(
                  'Your camera delivers at most {{resolution}}. Your video is upscaled in the combined file.',
                  { resolution: formatResolution(camera) },
                )
              : t(
                  'Your camera is sending {{resolution}}. Increase it to record your own video at {{target}}, or start now to keep the current resolution.',
                  { resolution: formatResolution(camera), target: preset },
                )}
          </Text>
          {!raiseAttempted && (
            <Button
              size="small"
              variant="outlined"
              loading={raising}
              onClick={raiseCamera}
              sx={{ mt: 1 }}
            >
              {t('Increase camera to {{target}}', { target: preset })}
            </Button>
          )}
        </Alert>
      )}

      {remotesBelowTarget.length > 0 && (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          {t(
            'Other participants are recorded at the resolution they send. Their video is upscaled in the combined file.',
          )}
        </Alert>
      )}
    </Box>
  );
}

export default RecordingResolutionCheck;
