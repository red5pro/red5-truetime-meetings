import { alpha } from '@mui/material';
import { Button, enterAnimation, Heading, radii, Text, themeColors, transition } from 'truetime-ui';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/system';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import ReplayIcon from '@mui/icons-material/Replay';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface LeftTheRoomProps {
  withError: string | null;
  handleLeaveFromRoom: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadError?: string | null;
  hasRecording?: boolean;
  downloadLocalRecording?: (filename?: string) => Promise<boolean> | void;
  retryUploadLocalRecording?: () => Promise<boolean> | void;
}

function LeftTheRoom({
  withError: leaveRoomWithError,
  handleLeaveFromRoom,
  isUploading,
  uploadProgress = 0,
  uploadStatus = 'idle',
  uploadError,
  hasRecording,
  downloadLocalRecording,
  retryUploadLocalRecording,
}: LeftTheRoomProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  React.useEffect(() => {
    handleLeaveFromRoom();
  }, []);

  const message =
    leaveRoomWithError !== null ? t('Something Went Wrong') : t('You left the meeting');

  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{ minHeight: '100vh', px: 2 }}
      >
        <Grid size={{ xs: 12, sm: 10, md: 8 }}>
          <Box textAlign="center" sx={enterAnimation()}>
            <Heading level={1} variant="h5" align="center" sx={{ mb: 2 }}>
              {message}
            </Heading>
            {leaveRoomWithError !== null && (
              <Text align="center" sx={{ mb: 4 }}>
                {t(leaveRoomWithError)}
              </Text>
            )}

            {(hasRecording || isUploading || uploadStatus !== 'idle') && (
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  borderRadius: `${radii.container}px`,
                  textAlign: 'left',
                  backgroundColor: themeColors(theme).surfaceRaised,
                  border: `1px solid ${themeColors(theme).border}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {uploadStatus === 'uploading' || isUploading ? (
                    <CloudUploadIcon sx={{ color: theme.palette.primary.main }} />
                  ) : uploadStatus === 'success' ? (
                    <CloudDoneIcon sx={{ color: theme.palette.success.main }} />
                  ) : uploadStatus === 'error' ? (
                    <CloudOffIcon sx={{ color: theme.palette.error.main }} />
                  ) : (
                    <VideoFileIcon sx={{ color: theme.palette.text.secondary }} />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Text sx={{ fontWeight: 600 }}>
                      {uploadStatus === 'uploading' || isUploading
                        ? t('Uploading local recording...')
                        : uploadStatus === 'success'
                          ? t('Recording uploaded')
                          : uploadStatus === 'error'
                            ? t('Recording upload failed')
                            : t('Local recording saved')}
                    </Text>
                    {uploadStatus === 'error' && uploadError && (
                      <Text variant="body2" tone="error">
                        {uploadError}
                      </Text>
                    )}
                    {uploadStatus === 'success' && (
                      <Text variant="body2" tone="muted">
                        {t('Your recording was uploaded successfully')}
                      </Text>
                    )}
                  </Box>
                </Box>

                {(uploadStatus === 'uploading' || isUploading) && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Text variant="body2" tone="muted">
                        {t('Please keep this tab open until the upload finishes')}
                      </Text>
                      <Text variant="body2" mono>
                        {uploadProgress}%
                      </Text>
                    </Box>
                    <Box
                      role="progressbar"
                      aria-label={t('Uploading local recording...')}
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      sx={{
                        height: 6,
                        width: '100%',
                        backgroundColor: alpha(themeColors(theme).text, 0.1),
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${uploadProgress}%`,
                          backgroundColor: theme.palette.primary.main,
                          transition: transition('width', {
                            duration: 'slow',
                            easing: 'decelerate',
                          }),
                        }}
                      />
                    </Box>
                  </Box>
                )}

                {hasRecording && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    <Button
                      color="secondary"
                      variant="outlined"
                      onClick={() => downloadLocalRecording?.()}
                      sx={{ width: '100%' }}
                    >
                      {t('Download Recording')}
                    </Button>
                    {uploadStatus === 'error' && (
                      <Button
                        color="primary"
                        startIcon={<ReplayIcon />}
                        onClick={() => retryUploadLocalRecording?.()}
                        sx={{ width: '100%' }}
                      >
                        {t('Retry Upload')}
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* One line: on narrow screens the buttons shrink (a long label wraps inside its
                button) instead of running past the edge */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'nowrap' }}>
              <Button
                color="secondary"
                variant="outlined"
                shape="pill"
                onClick={() => window.location.reload()}
                sx={{ flex: '0 1 auto', minWidth: 0, px: { xs: 2, sm: 2.5 } }}
              >
                {t('Rejoin')}
              </Button>
              <Button
                color="secondary"
                shape="pill"
                component="a"
                href="./"
                sx={{ flex: '0 1 auto', minWidth: 0, px: { xs: 2, sm: 2.5 } }}
              >
                {t('Return to home screen')}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default LeftTheRoom;
