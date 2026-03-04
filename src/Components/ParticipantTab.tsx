import React, { JSX, useCallback, useMemo } from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { styled, useTheme, Theme } from '@mui/material/styles';
import { SvgIcon } from './SvgIcon';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/system';
import { USER_ROLES } from '../constants/userRoles';
import { Button } from '@mui/material';

interface Participant {
  name: string;
  streamId?: string;
}

interface ParticipantItemProps {
  streamId: string;
  name: string;
  role: string;
  publishStreamId: string;
  onBlockUser: (streamId: string) => void;
  theme: Theme;
}

interface ParticipantTabProps {
  participantCount: number;
  publishStreamId: string;
  participants: Record<string, Participant>;
  role: string;
  blockUser: (streamId: string, duration: number) => void;
  globals?: any;
  isMyMicMuted?: boolean;
  muteLocalMic?: () => void;
  guestsWaitingApproval?: Record<string, any>;
  approveGuest?: (userId: string) => Promise<void>;
  rejectGuest?: (userId: string) => Promise<void>;
}

const ParticipantName = styled(Typography)(({ theme }: { theme: Theme }) => ({
  color: theme.palette.textColor,
  fontWeight: 500,
  fontSize: 14,
}));

const PinBtn = styled(Button)(({ theme }: { theme: Theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.themeColor?.[50],
  },
}));

// Memoized individual participant item component
const ParticipantItem = React.memo<ParticipantItemProps>(
  ({ streamId, name, role, publishStreamId, onBlockUser, theme }) => {
    const handleClick = useCallback(() => {
      onBlockUser(streamId);
    }, [streamId, onBlockUser]);

    const moderationButtons = useMemo(() => {
      if (role !== USER_ROLES.ADMIN || streamId === publishStreamId) {
        return null;
      }

      return (
        <PinBtn id={`kick-room-${streamId}`} sx={{ width: 28, pt: 1, pb: 1 }} onClick={handleClick}>
          <SvgIcon size={28} name="close" color={theme.palette?.participantListIcon?.primary} />
        </PinBtn>
      );
    }, [role, streamId, publishStreamId, handleClick, theme.palette?.participantListIcon?.primary]);

    return (
      <Grid
        id={`participant-item-${streamId}`}
        container
        alignItems="center"
        justifyContent="space-between"
        style={{ borderBottomWidth: 1 }}
        sx={{ borderColor: 'primary.main' }}
      >
        <Grid sx={{ pr: 1 }}>
          <ParticipantName
            variant="body1"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
            }}
          >
            {name}
          </ParticipantName>
        </Grid>
        <Box style={{ display: 'flex' }}>{moderationButtons}</Box>
      </Grid>
    );
  },
);

ParticipantItem.displayName = 'ParticipantItem';

function ParticipantTab({
  participantCount,
  publishStreamId,
  participants,
  role,
  blockUser,
  guestsWaitingApproval = {},
  approveGuest,
  rejectGuest,
}: ParticipantTabProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  // Memoize the block user handler
  const handleBlockUser = useCallback(
    (streamId: string) => {
      blockUser(streamId, 1000);
    },
    [blockUser],
  );

  // Memoize the participant count display
  const participantCountDisplay = useMemo(
    () => (
      <Grid container>
        <SvgIcon
          size={24}
          viewBox="0 0 500 500"
          name="participants"
          color={theme.palette?.participantListIcon?.primary}
        />
        <ParticipantName variant="body2" style={{ marginLeft: 4, fontWeight: 500 }}>
          {participantCount}
        </ParticipantName>
      </Grid>
    ),
    [participantCount, theme.palette?.participantListIcon?.primary],
  );

  // Memoize the participants list
  const participantsList = useMemo(() => {
    const items: JSX.Element[] = [];

    // Add current user first
    items.push(
      <ParticipantItem
        key={publishStreamId}
        streamId={publishStreamId}
        name={t('You')}
        role={role}
        publishStreamId={publishStreamId}
        onBlockUser={handleBlockUser}
        theme={theme}
      />,
    );

    // Add other participants
    Object.entries(participants).forEach(([streamId, broadcastObject]) => {
      if (publishStreamId !== streamId) {
        items.push(
          <ParticipantItem
            key={streamId}
            streamId={streamId}
            name={broadcastObject.name}
            role={role}
            publishStreamId={publishStreamId}
            onBlockUser={handleBlockUser}
            theme={theme}
          />,
        );
      }
    });

    return items;
  }, [participants, publishStreamId, role, handleBlockUser, theme, t]);

  const requestList = useMemo(() => {
    if (!guestsWaitingApproval || Object.keys(guestsWaitingApproval).length === 0) return null;

    return Object.values(guestsWaitingApproval).map((participant: any) => (
      <Grid
        key={participant.uid}
        id={`request-item-${participant.uid}`}
        container
        alignItems="center"
        justifyContent="space-between"
        style={{ borderBottomWidth: 1, flexWrap: 'nowrap' }}
        sx={{ borderColor: 'primary.main', py: 1 }}
      >
        <Grid size="grow" sx={{ pr: 1, minWidth: 0 }}>
          <ParticipantName
            variant="body1"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
            }}
          >
            {participant.name || participant.uid}
          </ParticipantName>
        </Grid>
        {approveGuest && (
          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => approveGuest(participant.name || participant.uid)}
              sx={{ textTransform: 'none' }}
            >
              {t('Admit')}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => rejectGuest?.(participant.name || participant.uid)}
              sx={{ textTransform: 'none' }}
            >
              {t('Reject')}
            </Button>
          </Box>
        )}
      </Grid>
    ));
  }, [guestsWaitingApproval, approveGuest, rejectGuest, t]);

  return (
    <Grid container sx={{ mt: 1 }} style={{ flexWrap: 'nowrap', flex: 'auto', overflowY: 'auto' }}>
      <Stack sx={{ width: '100%' }} spacing={3}>
        {participantCountDisplay}
        <Stack
          id="participant-scroll"
          style={{ flexWrap: 'nowrap', flex: 'auto', overflowY: 'scroll' }}
          spacing={2}
        >
          {requestList && requestList.length > 0 && (
            <>
              <Typography variant="overline" color="textSecondary">
                {t('Waiting for approval')}
              </Typography>
              {requestList}
              <Typography variant="overline" color="textSecondary" sx={{ mt: 2 }}>
                {t('In Meeting')}
              </Typography>
            </>
          )}
          {participantsList}
        </Stack>
      </Stack>
    </Grid>
  );
}

// Memoize the entire component
export default React.memo(ParticipantTab);
