import React from 'react';
import { JoinFormProps } from '../types.ts';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/system';
import { ParticipantInfo } from './ParticipantInfo.tsx';
import { Button, FormField, Input } from 'truetime-ui';

export const JoinForm = React.memo<JoinFormProps>(
  ({
    streamName,
    onStreamNameChange,
    streamNameFieldError,
    isAuthEnabled: _isAuthEnabled,
    isGuest,
    onSubmit,
    isJoining,
    roomInfo,
  }) => {
    const { t } = useTranslation();

    return (
      <Grid container justifyContent="center">
        <form onSubmit={onSubmit}>
          <Box style={{ margin: '21px' }}>
            <ParticipantInfo roomInfo={roomInfo} currentUserName={streamName} />
          </Box>

          <Grid container spacing={2} sx={{ mt: 1, mb: 4 }}>
            <Grid size={{ xs: 12, sm: 12 }}>
              <FormField
                label={t('Your name')}
                required
                fullWidth
                id="participant_name"
                disabled={isJoining}
                error={streamNameFieldError}
                helperText={streamNameFieldError ? t('Spaces are not allowed') : undefined}
              >
                <Input
                  autoFocus
                  fullWidth
                  value={streamName || ''}
                  onChange={onStreamNameChange}
                  placeholder={t('Your name')}
                  inputProps={{ autoComplete: 'name' }}
                />
              </FormField>
            </Grid>
          </Grid>

          <Grid container justifyContent="center">
            <Grid size={{ sm: 6, xs: 12 }}>
              <Button
                fullWidth
                shape="pill"
                color="secondary"
                size="large"
                type="submit"
                id="room_join_button"
                loading={isJoining}
                disabled={streamNameFieldError}
              >
                {isJoining
                  ? t('Joining...')
                  : isGuest
                    ? t('Ask to Join')
                    : roomInfo['userCount'] > 0
                      ? t('Join')
                      : t('Start Call')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Grid>
    );
  },
);

JoinForm.displayName = 'JoinForm';
