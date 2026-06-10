import { Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/system';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface LeftTheRoomProps {
  withError: string | null;
  handleLeaveFromRoom: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadError?: string | null;
}

function LeftTheRoom({
  withError: leaveRoomWithError,
  handleLeaveFromRoom,
  isUploading,
  uploadProgress = 0,
  uploadStatus,
  uploadError,
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
        <Grid size={{ xs: 12, sm: 10, md: 8, lg: 6 }}>
          <Box textAlign="center">
            <Typography variant="h5" align="center" sx={{ mb: 2 }}>
              {message}
            </Typography>
            {leaveRoomWithError !== null && (
              <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                {t(leaveRoomWithError)}
              </Typography>
            )}

            {(isUploading || uploadStatus === 'uploading') && (
              <Box sx={{ mb: 4, px: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('Uploading local recording...')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
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

            {uploadStatus === 'error' && (
              <Typography variant="body2" color="error" align="center" sx={{ mb: 4 }}>
                {t('Recording upload failed')}
                {uploadError ? `: ${uploadError}` : ''}
              </Typography>
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
