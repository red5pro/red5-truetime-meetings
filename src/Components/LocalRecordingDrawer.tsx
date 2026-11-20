import * as React from 'react';
import { useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import { alpha, styled, useTheme, Theme } from '@mui/material/styles';
import { Heading, radii, themeColors, transition } from 'truetime-ui';
import Grid from '@mui/material/Grid2';
import { Typography, Button, Divider, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from '../styles/themeUtil';
import { SvgIcon } from './SvgIcon';

interface LocalRecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  chunks: number;
  segments: number;
  estimatedSize: number;
  state: string | null;
}

interface LocalRecordingDrawerProps {
  open?: boolean;
  onClose?: (open: boolean) => void;
  status: LocalRecordingStatus | null;
  isPaused: boolean;
  isActive: boolean;
  onPause: () => void;
  onResume: () => void;
  onStart: () => void;
  onStop: () => void;
  onDownload: (filename?: string) => Promise<void> | void;
  onUpload: () => Promise<void> | void;
  onClear: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadError?: string | null;
  hasS3Config?: boolean;
  onSetUpS3?: () => void;
  recordingStartTime?: number | null;
}

const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => ({
  ...getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false),
}));

const ContentGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  padding: 24,
  background: theme.palette.themeColor?.[60],
  borderRadius: radii.container,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Composite recording stream is 1280x720 @ QUALITY_MEDIUM avc/aac (see useRecording.ts
// startLocalRecording). Mediabunny only exposes the final byte size once the output is
// finalized, so while recording is in progress we approximate it from elapsed time using
// the same bitrate formula mediabunny derives for that resolution/codec/quality combo.
const ESTIMATED_BYTES_PER_SECOND = (1389000 + 128000) / 8;

interface StorageEstimate {
  usage: number;
  quota: number;
}

type RecordingCardState = 'recording' | 'paused' | 'stopped' | 'inactive';

/** Card colours per state, from the theme: recording is the error red, paused the warning amber. */
const recordingCardStyles = (
  theme: Theme,
  state: RecordingCardState,
): { background: string; border: string; accent: string } => {
  const colors = themeColors(theme);
  const accent =
    state === 'recording'
      ? colors.error
      : state === 'paused'
        ? colors.warning
        : alpha(colors.text, 0.7);
  const tinted = state === 'recording' || state === 'paused';
  return {
    background: alpha(tinted ? accent : colors.text, tinted ? 0.12 : 0.04),
    border: alpha(tinted ? accent : colors.text, tinted ? 0.4 : 0.12),
    accent,
  };
};

const RecordingStatusCard = ({
  cardState,
  label,
  value,
}: {
  cardState: RecordingCardState;
  label: string;
  value: string;
}) => {
  const theme = useTheme();
  const styles = recordingCardStyles(theme, cardState);

  return (
    <Box
      sx={{
        backgroundColor: styles.background,
        border: '1px solid',
        borderColor: styles.border,
        borderRadius: `${radii.container}px`,
        p: 3,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: styles.accent,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: styles.accent,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
);

const LocalRecordingDrawer = React.memo<LocalRecordingDrawerProps>((props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    status,
    isActive,
    isPaused,
    onDownload,
    onClear,
    onUpload,
    open,
    onClose,
    isUploading,
    uploadProgress,
    uploadStatus,
    uploadError,
    hasS3Config,
    onSetUpS3,
    recordingStartTime,
  } = props;

  // Timer state for recording duration
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);

  // Poll the browser's Storage API for available disk space while the drawer is open
  useEffect(() => {
    if (!open || !navigator.storage?.estimate) {
      return;
    }

    const refreshStorageEstimate = () => {
      navigator.storage
        .estimate()
        .then((estimate) => {
          setStorageEstimate({ usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 });
        })
        .catch(() => setStorageEstimate(null));
    };

    refreshStorageEstimate();
    const interval = setInterval(refreshStorageEstimate, 5000);
    return () => clearInterval(interval);
  }, [open]);

  // Update timer every second while recording is active
  useEffect(() => {
    if (!isActive || !recordingStartTime) {
      if (!isActive && elapsedSeconds > 0) {
        // Save the final duration before resetting
        queueMicrotask(() => {
          setFinalDuration(elapsedSeconds);
          setElapsedSeconds(0);
        });
      }
      return;
    }

    // Reset finalDuration when starting a new recording
    queueMicrotask(() => setFinalDuration(0));

    // Calculate initial elapsed time
    const calculateElapsed = () => Math.floor((Date.now() - recordingStartTime) / 1000);
    queueMicrotask(() => setElapsedSeconds(calculateElapsed()));

    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsedSeconds(calculateElapsed());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, recordingStartTime]);

  const cardState: RecordingCardState = isActive
    ? isPaused
      ? 'paused'
      : 'recording'
    : status && (status.chunks > 0 || status.segments > 0)
      ? 'stopped'
      : 'inactive';

  const cardLabel = {
    recording: t('Recording'),
    paused: t('Paused'),
    stopped: t('Stopped'),
    inactive: t('Inactive'),
  }[cardState];

  const liveEstimatedSize = elapsedSeconds * ESTIMATED_BYTES_PER_SECOND;
  const finalSize = status?.estimatedSize ?? 0;
  const storageUsedBytes = isActive ? liveEstimatedSize : finalSize;
  const storagePercentUsed =
    storageEstimate && storageEstimate.quota > 0
      ? Math.min((storageUsedBytes / storageEstimate.quota) * 100, 100)
      : null;

  return (
    <Red5Drawer
      anchor="right"
      id="local-recording-drawer"
      open={open}
      variant="persistent"
      PaperProps={{ style: { pointerEvents: open ? 'auto' : 'none' } }}
    >
      <ContentGrid
        container
        direction="column"
        style={{
          flexWrap: 'nowrap',
          background: theme.palette.themeColor?.[60],
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Heading level={2} variant="h6">
            {t('Local Recording')}
          </Heading>
          <CloseDrawerButton handleLocalRecordingDrawerOpen={(open: boolean) => onClose?.(open)} />
        </Grid>

        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
          <RecordingStatusCard
            cardState={cardState}
            label={cardLabel}
            value={formatDuration(isActive ? elapsedSeconds : finalDuration)}
          />

          {uploadStatus === 'uploading' && (
            <Box sx={{ mb: 3, px: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('Uploading to S3...')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {uploadProgress}%
                </Typography>
              </Box>
              <Box
                role="progressbar"
                aria-label={t('Uploading to S3...')}
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                sx={{
                  height: 4,
                  width: '100%',
                  backgroundColor: alpha(themeColors(theme).text, 0.1),
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: theme.palette.primary.main,
                    transition: transition('width', { duration: 'slow', easing: 'decelerate' }),
                  }}
                />
              </Box>
            </Box>
          )}

          {uploadStatus === 'success' && (
            <Box sx={{ mb: 3, p: 2, pl: '44px', borderRadius: `${radii.control}px` }}>
              <Grid container spacing={2} alignItems="center">
                <Grid>
                  <SvgIcon size={24} name="check-circle" color={theme.palette.success.main} />
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {t('Upload Successful')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('Recording has been uploaded to S3')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {uploadStatus === 'error' && (
            <Box sx={{ mb: 3, p: 2, pl: '44px', borderRadius: `${radii.control}px` }}>
              <Grid container spacing={2} alignItems="center">
                <Grid>
                  <SvgIcon size={24} name="error" color={theme.palette.error.main} />
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {t('Upload Failed')}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    {uploadError || t('Unknown error occurred')}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => onUpload && onUpload()}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('Retry Upload')}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          <InfoRow
            label={isActive ? t('Estimated size') : t('File size')}
            value={formatSize(storageUsedBytes)}
          />

          {storageEstimate && storageEstimate.quota > 0 && (
            <>
              <Divider sx={{ opacity: 0.1 }} />
              <InfoRow
                label={t('Available storage')}
                value={t('{{available}} free', {
                  available: formatSize(Math.max(storageEstimate.quota - storageUsedBytes, 0)),
                })}
              />
              <Box
                role="meter"
                aria-label={t('Storage used')}
                aria-valuenow={Math.round(storagePercentUsed ?? 0)}
                aria-valuemin={0}
                aria-valuemax={100}
                sx={{
                  height: 6,
                  width: '100%',
                  backgroundColor: alpha(themeColors(theme).text, 0.1),
                  borderRadius: '3px',
                  overflow: 'hidden',
                  mt: 0.5,
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${storagePercentUsed}%`,
                    // Usage, not an error: the accent, turning amber when space runs low
                    backgroundColor:
                      (storagePercentUsed ?? 0) >= 80
                        ? themeColors(theme).warning
                        : theme.palette.primary.main,
                    transition: transition(['width', 'background-color'], {
                      duration: 'slow',
                      easing: 'decelerate',
                    }),
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('{{used}} used of {{total}}', {
                  used: formatSize(storageUsedBytes),
                  total: formatSize(storageEstimate.quota),
                })}
              </Typography>
            </>
          )}

          {!isActive && !status && (
            <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('No active local recording. Start recording below.')}
              </Typography>
            </Box>
          )}

          {!hasS3Config && uploadStatus !== 'uploading' && uploadStatus !== 'success' && (
            <Box
              sx={{
                mt: 2,
                px: 2,
                py: 1.5,
                borderRadius: `${radii.control}px`,
                backgroundColor: alpha(themeColors(theme).warning, 0.08),
                border: `1px solid ${alpha(themeColors(theme).warning, 0.25)}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <SvgIcon size={18} name="alert-circle" color={themeColors(theme).warning} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {t('Set up your S3 credentials to upload recordings automatically.')}
                </Typography>
                {onSetUpS3 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={onSetUpS3}
                      sx={{ borderRadius: `${radii.pill}px` }}
                    >
                      {t('Set up S3')}
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3, opacity: 0.1 }} />

        <Grid container spacing={2} justifyContent="center">
          {!isActive && status && (
            <>
              <Grid size={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => onDownload()}
                  sx={{ borderRadius: `${radii.pill}px`, py: 1 }}
                >
                  {t('Download')}
                </Button>
              </Grid>
              <Grid size={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={onClear}
                  disabled={isUploading}
                  sx={{ borderRadius: `${radii.pill}px`, py: 1, opacity: 0.7 }}
                >
                  {t('Clear')}
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </ContentGrid>
    </Red5Drawer>
  );
});

LocalRecordingDrawer.displayName = 'LocalRecordingDrawer';

export default LocalRecordingDrawer;
