import * as React from 'react';
import { useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, useTheme, Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Typography, Button, Divider, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from '../styles/themeUtil';
import { SvgIcon } from './SvgIcon';
import Lottie from 'lottie-react';
import recordingAnimation from '../styles/lottieFiles/recording-animation.json';
import clockAnimation from '../styles/lottieFiles/clock.json';

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
  recordingStartTime?: number | null;
}

const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => ({
  ...getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false),
}));

const ContentGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  padding: 24,
  background: theme.palette.themeColor?.[60],
  borderRadius: 10,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const StatusItem = ({
  label,
  value,
  icon,
  iconColor,
  lottieType,
}: {
  label: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  lottieType?: 'recording' | 'clock';
}) => {
  const theme = useTheme();

  const getLottieAnimation = () => {
    switch (lottieType) {
      case 'recording':
        return recordingAnimation;
      case 'clock':
        return clockAnimation;
      default:
        return null;
    }
  };

  const animationData = getLottieAnimation();

  return (
    <Grid container alignItems="center" spacing={2} sx={{ mb: 2 }}>
      <Grid>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: 32, height: 32 }}
            />
          ) : (
            <SvgIcon size={20} name={icon} color={iconColor || theme.palette.text.primary} />
          )}
        </Box>
      </Grid>
      <Grid sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
      </Grid>
    </Grid>
  );
};

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
        setFinalDuration(elapsedSeconds);
        setElapsedSeconds(0);
      }
      return;
    }

    // Reset finalDuration when starting a new recording
    setFinalDuration(0);

    // Calculate initial elapsed time
    const calculateElapsed = () => Math.floor((Date.now() - recordingStartTime) / 1000);
    setElapsedSeconds(calculateElapsed());

    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsedSeconds(calculateElapsed());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, recordingStartTime]);

  const renderActiveStatus = () => {
    if (isActive) return isPaused ? t('Paused') : t('Recording');
    if (status && (status.chunks > 0 || status.segments > 0)) return t('Stopped');
    return t('Inactive');
  };

  return (
    <Red5Drawer
      transitionDuration={200}
      anchor="right"
      id="local-recording-drawer"
      open={open}
      variant="persistent"
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
          <Typography variant="h6" component="div">
            {t('Local Recording')}
          </Typography>
          <CloseDrawerButton handleLocalRecordingDrawerOpen={(open: boolean) => onClose?.(open)} />
        </Grid>

        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
          <StatusItem
            label={t('Status')}
            value={renderActiveStatus()}
            icon={isUploading ? 'cloud-upload' : isActive ? 'record' : 'stop'}
            iconColor={isActive && !isPaused ? '#E74C3C' : undefined}
            lottieType={isActive && !isPaused ? 'recording' : undefined}
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
                sx={{
                  height: 4,
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: theme.palette.primary.main,
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </Box>
            </Box>
          )}

          {uploadStatus === 'success' && (
            <Box sx={{ mb: 3, px: 1, p: 2, borderRadius: 2, paddingLeft: '44px' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid>
                  <SvgIcon size={24} name="check-circle" color={theme.palette.success.main} />
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Typography variant="body2" color="white" sx={{ fontWeight: 500 }}>
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
            <Box sx={{ mb: 3, px: 1, p: 2, borderRadius: 2, paddingLeft: '44px' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid>
                  <SvgIcon size={24} name="error" color={theme.palette.error.main} />
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Typography variant="body2" color="white" sx={{ fontWeight: 500 }}>
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

          {isActive && (
            <>
              <StatusItem
                label={t('Duration')}
                value={formatDuration(elapsedSeconds)}
                icon="clock"
                lottieType="clock"
              />
              <StatusItem
                label={t('Estimated Size')}
                value={formatSize(elapsedSeconds * ESTIMATED_BYTES_PER_SECOND)}
                icon="database"
              />
            </>
          )}

          {!isActive && ((status?.estimatedSize ?? 0) > 0 || finalDuration > 0) && (
            <>
              <StatusItem
                label={t('Final Duration')}
                value={formatDuration(finalDuration)}
                icon="clock"
              />
              {status && status.estimatedSize > 0 && (
                <StatusItem
                  label={t('File Size')}
                  value={formatSize(status.estimatedSize)}
                  icon="database"
                />
              )}
            </>
          )}

          {storageEstimate && storageEstimate.quota > 0 && (
            <StatusItem
              label={t('Available Storage')}
              value={t('{{available}} free of {{total}}', {
                available: formatSize(Math.max(storageEstimate.quota - storageEstimate.usage, 0)),
                total: formatSize(storageEstimate.quota),
              })}
              icon="database"
            />
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
                borderRadius: 2,
                backgroundColor: 'rgba(255, 193, 7, 0.08)',
                border: '1px solid rgba(255, 193, 7, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <SvgIcon size={18} name="alert-circle" color="#FFC107" />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {t('Set up your S3 credentials to upload recordings automatically.')}
              </Typography>
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
                  sx={{ borderRadius: 6, py: 1 }}
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
                  sx={{ borderRadius: 6, py: 1, opacity: 0.7 }}
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
