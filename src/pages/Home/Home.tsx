import { FormEvent, useState } from 'react';
import { Box, InputAdornment } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Keyboard, VideoCall } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Button, Heading, Input, Text, themeColors, enterAnimation, motion } from 'truetime-ui';
import Logo from 'truetime-ui/assets/images/red5-cloud-logo.svg';
import { getRuntimeConfig } from '../../utils/configStore';
import { roomPathFromInput } from './roomPath';

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [room, setRoom] = useState('');

  const logoUrl = getRuntimeConfig().VITE_LOGO_URL || Logo;
  const roomPath = roomPathFromInput(room);

  const handleNewMeeting = () => navigate(`/${nanoid(8)}`);

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    if (roomPath) navigate(roomPath);
  };

  return (
    <Box
      component="main"
      sx={{
        // The routes sit in a flex row (CustomRoutes); fill it so the content can centre in it
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          // Logo, heading, text, button, divider and form arrive one after another
          '& > *': enterAnimation(),
          ...Object.fromEntries(
            [1, 2, 3, 4, 5, 6].map((n) => [
              `& > :nth-child(${n})`,
              { animationDelay: `${(n - 1) * motion.stagger * 1.5}ms` },
            ]),
          ),
        }}
      >
        <Box
          component="img"
          src={logoUrl}
          alt={t('TrueTime Meeting™')}
          sx={{ maxWidth: 200, maxHeight: 64, mb: 4 }}
        />

        <Heading level={1} variant="h5" sx={{ mb: 1 }}>
          {t('TrueTime Meeting™')}
        </Heading>
        <Text tone="muted" sx={{ mb: 4 }}>
          {t('Start a new meeting, or join one with its room name or link.')}
        </Text>

        <Button
          id="create_meeting_button"
          shape="pill"
          color="secondary"
          size="large"
          fullWidth
          startIcon={<VideoCall />}
          onClick={handleNewMeeting}
        >
          {t('New meeting')}
        </Button>

        {/* "or" between the two ways in */}
        <Box
          aria-hidden
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            my: 3,
            color: themeColors(theme).mutedText,
            fontSize: 13,
            '&::before, &::after': {
              content: '""',
              flex: 1,
              height: '1px',
              backgroundColor: alpha(themeColors(theme).text, 0.12),
            },
          })}
        >
          {t('or')}
        </Box>

        <Box
          component="form"
          onSubmit={handleJoin}
          aria-label={t('Join a meeting')}
          sx={{ display: 'flex', gap: 1, width: '100%' }}
        >
          <Input
            id="room_name"
            autoFocus
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            placeholder={t('Enter a room name or link')}
            inputProps={{ 'aria-label': t('Room name or link'), autoComplete: 'off' }}
            startAdornment={
              <InputAdornment position="start">
                <Keyboard fontSize="small" />
              </InputAdornment>
            }
            sx={{ flex: 1 }}
          />
          <Button
            id="room_join_button"
            type="submit"
            shape="pill"
            variant="text"
            color="inherit"
            disabled={!roomPath}
            sx={{ flexShrink: 0, px: 2.5 }}
          >
            {t('Join')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
