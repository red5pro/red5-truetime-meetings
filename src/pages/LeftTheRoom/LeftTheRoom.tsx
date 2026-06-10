import { Button, Typography } from '@mui/material';
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
          <Box textAlign="center">
            <Typography variant="h5" align="center" sx={{ mb: 2 }}>
              {message}
            </Typography>
            {leaveRoomWithError !== null && (
              <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                {t(leaveRoomWithError)}
              </Typography>
            )}

            {(hasRecording || isUploading || uploadStatus !== 'idle') && (
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  borderRadius: '16px',
                  textAlign: 'left',
                  backgroundColor: theme.palette.themeColor?.[70],
                  border: `1px solid ${theme.palette.themeColor?.[50]}`,
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
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {uploadStatus === 'uploading' || isUploading
                        ? t('Uploading local recording...')
                        : uploadStatus === 'success'
                          ? t('Recording uploaded')
                          : uploadStatus === 'error'
                            ? t('Recording upload failed')
                            : t('Local recording saved')}
                    </Typography>
                    {uploadStatus === 'error' && uploadError && (
                      <Typography variant="caption" color="error">
                        {uploadError}
                      </Typography>
                    )}
                    {uploadStatus === 'success' && (
                      <Typography variant="caption" color="text.secondary">
                        {t('Your recording was uploaded successfully')}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {(uploadStatus === 'uploading' || isUploading) && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('Please keep this tab open until the upload finishes')}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {uploadProgress}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 6,
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 3,
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

                {hasRecording && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, margin: '21px' }}>
                    <Button
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={() => downloadLocalRecording?.()}
                      sx={{ whiteSpace: 'nowrap', width: '100%' }}
                    >
                      {t('Download Recording')}
                    </Button>
                    {uploadStatus === 'error' && (
                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        startIcon={<ReplayIcon />}
                        onClick={() => retryUploadLocalRecording?.()}
                        sx={{ whiteSpace: 'nowrap', width: '100%' }}
                      >
                        {t('Retry Upload')}
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'nowrap' }}>
              <Button
                color="secondary"
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  px: 2,
                }}
              >
                {t('Rejoin')}
              </Button>
              <Button
                color="secondary"
                variant="contained"
                component="a"
                href="./"
                sx={{
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  px: 2,
                }}
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
