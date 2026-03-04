import { Button, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/system';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface LeftTheRoomProps {
  withError: string | null;
  handleLeaveFromRoom: () => void;
}

function LeftTheRoom({ withError: leaveRoomWithError, handleLeaveFromRoom }: LeftTheRoomProps) {
  const { t } = useTranslation();

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
