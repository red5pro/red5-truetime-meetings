import { Button, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/system';
import { ChangeEvent, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import Stack from '@mui/material/Stack';
// @ts-expect-error: temporary fix for legacy code
import { GoToLobbyDialog } from '../../Components/Footer/Components/GoToLobbyDialog.tsx';
import Logo from '../../static/images/logo.svg';
import { getRuntimeConfig } from '../../utils/configStore';

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const joinToken = useRef<string>('');
  const joinRoomUrl = useRef<string>('');

  const [goToLobbyDialogOpen, setGoToLobbyDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');

  // Get logo URL from config, fallback to default logo
  const config = getRuntimeConfig();
  const logoUrl = config.VITE_LOGO_URL || Logo;

  const handleRoomNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRoomName(event.target.value);
  };

  const handleCreateMeeting = () => {
    goToLobby();
  };

  const goToLobby = useCallback(
    (roomId?: string, joinToken?: string) => {
      const newMeetingPath =
        roomId === undefined
          ? `/${nanoid(8)}`
          : `/${roomId}${joinToken ? `?token=${joinToken}` : ''}`;

      navigate(newMeetingPath); // Navigate to the new path programmatically
    },
    [navigate],
  );

  const handleGoToLobbyDialogClose = () => {
    setGoToLobbyDialogOpen(false);
  };

  const handleGoToLobbyClicked = () => {
    goToLobby(roomName, joinToken.current);
  };

  const handleJoinRoom = () => {
    if (roomName !== '') {
      const roomNameInput = document.getElementById('room_name') as HTMLInputElement;
      const roomValue = roomNameInput?.value || roomName;
      navigate(`/${roomValue}`);
    }
  };

  return (
    <>
      <GoToLobbyDialog
        onClose={handleGoToLobbyDialogClose}
        url={joinRoomUrl.current}
        open={goToLobbyDialogOpen}
        onGoToLobbyClicked={handleGoToLobbyClicked}
      />

      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{
          minHeight: '100vh',
          px: 2,
          width: '100%',
        }}
      >
        <Grid size={{ xs: 12, sm: 10, md: 8, lg: 6 }} sx={{ width: '100%' }}>
          <Box textAlign="center">
            <Typography variant="h5" align="center" sx={{ mb: 3 }}>
              {t('Join a conference room')}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <img src={logoUrl} alt="Red5 Logo" />
            </Box>
            <Typography variant="h6" align="center" sx={{ mb: 4 }}>
              {t('TrueTime Meeting')}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <Button
                color="secondary"
                variant="contained"
                type="submit"
                onClick={handleCreateMeeting}
                style={{ borderRadius: 26 }}
                id="create_meeting_button"
                sx={{ minWidth: 120 }}
              >
                {t('New meeting')}
              </Button>

              <TextField
                autoFocus
                required
                onChange={handleRoomNameChange}
                color="primary"
                variant="outlined"
                autoComplete="cc-exp-year"
                placeholder={t('Room name')}
                id="room_name"
                value={roomName}
                sx={{ minWidth: 200 }}
              />

              <Typography
                id="room_join_button"
                variant="body1"
                style={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  color: roomName === '' ? 'grey' : 'white',
                  minWidth: '60px',
                  textAlign: 'center',
                }}
                onClick={handleJoinRoom}
              >
                {t('Join')}
              </Typography>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default Home;
