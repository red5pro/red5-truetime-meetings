import React, { JSX, useMemo, useState } from 'react';
import { Box, IconButton, InputAdornment, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MicOff, PanTool, PersonRemove, Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Button, Heading, Input, Text, TruncatedText, radii, themeColors } from 'truetime-ui';
import { USER_ROLES } from '../constants/userRoles';

interface Participant {
  name: string;
  streamId?: string;
  audioEnabled?: boolean;
  isRaiseHand?: boolean;
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

interface PersonRow {
  id: string;
  name: string;
  isMe: boolean;
  micOff: boolean;
  handRaised: boolean;
}

/** Up to two initials for the avatar: "Ada Lovelace" → "AL", "ada" → "A" */
const initialsOf = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length === 1 ? [words[0][0]] : [words[0][0], words[words.length - 1][0]];
  return letters.join('').toUpperCase();
};

function Avatar({ name }: { name: string }) {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: radii.round,
        display: 'grid',
        placeItems: 'center',
        fontSize: 13,
        fontWeight: 600,
        color: themeColors(theme).text,
        backgroundColor: themeColors(theme).surfaceHover,
      })}
    >
      {initialsOf(name)}
    </Box>
  );
}

/** One row: avatar, name, status icons and actions */
function Row({
  id,
  name,
  suffix,
  status,
  actions,
}: {
  id: string;
  name: string;
  suffix?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Box
      component="li"
      id={id}
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1,
        py: 0.75,
        borderRadius: `${radii.container}px`,
        '&:hover': { backgroundColor: alpha(themeColors(theme).text, 0.05) },
        // Row actions show on hover or keyboard focus; touch screens can't hover, so always there
        '& .row-actions': { opacity: 0, transition: 'opacity 0.15s' },
        '&:hover .row-actions, &:focus-within .row-actions': { opacity: 1 },
        '@media (hover: none)': { '& .row-actions': { opacity: 1 } },
      })}
    >
      <Avatar name={name} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
        <Text variant="body2" component="div" sx={{ minWidth: 0, fontWeight: 500 }}>
          <TruncatedText>{name}</TruncatedText>
        </Text>
        {suffix && (
          <Text variant="body2" tone="muted" component="span" sx={{ flexShrink: 0 }}>
            {suffix}
          </Text>
        )}
      </Box>
      {status && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>{status}</Box>
      )}
      {actions && (
        <Box className="row-actions" sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}

function SectionTitle({ id, title, count }: { id: string; title: string; count: number }) {
  return (
    <Heading
      id={id}
      level={3}
      variant="subtitle2"
      sx={(theme) => ({
        color: themeColors(theme).mutedText,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontSize: 12,
        px: 1,
        mb: 0.5,
      })}
    >
      {title} · {count}
    </Heading>
  );
}

const listSx = { listStyle: 'none', m: 0, p: 0 } as const;

function ParticipantTab({
  publishStreamId,
  participants,
  role,
  blockUser,
  isMyMicMuted,
  guestsWaitingApproval = {},
  approveGuest,
  rejectGuest,
}: ParticipantTabProps): JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const isHost = role === USER_ROLES.ADMIN;

  // You first, then raised hands, then everyone else by name
  const people = useMemo<PersonRow[]>(() => {
    const others = Object.entries(participants)
      .filter(([streamId]) => streamId !== publishStreamId)
      .map(([streamId, participant]) => ({
        id: streamId,
        name: participant.name || streamId,
        isMe: false,
        micOff: participant.audioEnabled === false,
        handRaised: Boolean(participant.isRaiseHand),
      }))
      .sort((a, b) => Number(b.handRaised) - Number(a.handRaised) || a.name.localeCompare(b.name));
    return [
      {
        id: publishStreamId,
        name: t('You'),
        isMe: true,
        micOff: Boolean(isMyMicMuted),
        handRaised: false,
      },
      ...others,
    ];
  }, [participants, publishStreamId, isMyMicMuted, t]);

  const waiting = useMemo(
    () =>
      Object.values(guestsWaitingApproval).map((guest: { uid?: string; name?: string }) => ({
        id: String(guest.uid),
        name: String(guest.name || guest.uid),
        // The approve/reject calls take the name when there is one (as before)
        requestId: String(guest.name || guest.uid),
      })),
    [guestsWaitingApproval],
  );

  const needle = query.trim().toLowerCase();
  const matches = (name: string) => !needle || name.toLowerCase().includes(needle);
  const shownPeople = people.filter((person) => matches(person.name));
  const shownWaiting = waiting.filter((guest) => matches(guest.name));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        flex: 'auto',
        minHeight: 0,
        mt: 1,
      }}
    >
      <Input
        id="participant-search"
        size="small"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('Search for people')}
        inputProps={{ 'aria-label': t('Search for people') }}
        startAdornment={
          <InputAdornment position="start">
            <Search fontSize="small" />
          </InputAdornment>
        }
      />

      <Box
        id="participant-scroll"
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {waiting.length > 0 && (
          <Box component="section" aria-labelledby="participants-waiting">
            <SectionTitle
              id="participants-waiting"
              title={t('Waiting to join')}
              count={waiting.length}
            />
            <Box component="ul" sx={listSx}>
              {shownWaiting.map((guest) => (
                <Row
                  key={guest.id}
                  id={`request-item-${guest.id}`}
                  name={guest.name}
                  status={
                    approveGuest && (
                      <>
                        <Button
                          size="small"
                          variant="text"
                          color="inherit"
                          onClick={() => rejectGuest?.(guest.requestId)}
                          aria-label={`${t('Deny')} ${guest.name}`}
                        >
                          {t('Deny')}
                        </Button>
                        <Button
                          size="small"
                          shape="pill"
                          color="secondary"
                          onClick={() => approveGuest(guest.requestId)}
                          aria-label={`${t('Admit')} ${guest.name}`}
                        >
                          {t('Admit')}
                        </Button>
                      </>
                    )
                  }
                />
              ))}
            </Box>
          </Box>
        )}

        <Box component="section" aria-labelledby="participants-in-meeting">
          <SectionTitle
            id="participants-in-meeting"
            title={t('In the meeting')}
            count={people.length}
          />
          <Box component="ul" sx={listSx}>
            {shownPeople.map((person) => (
              <Row
                key={person.id}
                id={`participant-item-${person.id}`}
                name={person.name}
                status={
                  <>
                    {person.handRaised && (
                      <Tooltip title={t('Hand raised')}>
                        <Box
                          component="span"
                          role="img"
                          aria-label={t('Hand raised')}
                          sx={(theme) => ({ display: 'flex', color: themeColors(theme).warning })}
                        >
                          <PanTool fontSize="small" />
                        </Box>
                      </Tooltip>
                    )}
                    {person.micOff && (
                      <Tooltip title={t('Microphone off')}>
                        <Box
                          component="span"
                          role="img"
                          aria-label={t('Microphone off')}
                          sx={(theme) => ({ display: 'flex', color: themeColors(theme).mutedText })}
                        >
                          <MicOff fontSize="small" />
                        </Box>
                      </Tooltip>
                    )}
                  </>
                }
                actions={
                  isHost && !person.isMe ? (
                    <Tooltip title={t('Remove from meeting')}>
                      <IconButton
                        id={`kick-room-${person.id}`}
                        size="small"
                        aria-label={`${t('Remove from meeting')}: ${person.name}`}
                        onClick={() => blockUser(person.id, 1000)}
                      >
                        <PersonRemove fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : undefined
                }
              />
            ))}
          </Box>
          {needle && shownPeople.length === 0 && shownWaiting.length === 0 && (
            <Text variant="body2" tone="muted" sx={{ px: 1, py: 2, textAlign: 'center' }}>
              {t('No one matches “{{query}}”', { query: query.trim() })}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default React.memo(ParticipantTab);
