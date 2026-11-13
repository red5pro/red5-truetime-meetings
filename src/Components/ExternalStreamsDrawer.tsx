import * as React from 'react';
import { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, Theme } from '@mui/material/styles';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Refresh, SensorsOff, Videocam } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Spinner,
  StatusBadge,
  Text,
  TruncatedText,
  radii,
  themeColors,
} from 'truetime-ui';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from '../styles/themeUtil';
import { ExternalStream } from '../hooks/useExternalStreams';
import { parseMetaData } from '../utils/utils';
import { MetaDataKeys } from '../constants/metaDataKeys';

interface ExternalStreamsDrawerProps {
  open?: boolean;
  onClose?: (open: boolean) => void;
  streams: ExternalStream[];
  participants: Record<string, any>;
  fetchStreams: () => Promise<ExternalStream[]>;
  addToRoom: (streamName: string) => Promise<void>;
  removeFromRoom: (streamName: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const EXTERNAL_STREAM_METADATA = 'external-stream';

interface StreamItem {
  key: string;
  streamName: string;
  isJoined: boolean;
  durationMs?: number;
  viewers?: number;
}

const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => ({
  ...getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false),
}));

const Panel = styled(Box)(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor?.[60],
  borderRadius: 10,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

/** How long a stream has been live: "45s", "12m", "1h 05m" */
const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return `${Math.max(0, Math.floor(ms / 1000))}s`;
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
};

const ExternalStreamsDrawer = React.memo<ExternalStreamsDrawerProps>((props) => {
  const { t } = useTranslation();
  const {
    open,
    onClose,
    streams,
    participants,
    fetchStreams,
    addToRoom,
    removeFromRoom,
    loading,
    error,
  } = props;
  // The stream being added or removed, so only its row shows progress
  const [busyStream, setBusyStream] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStreams();
    }
  }, [open, fetchStreams]);

  const toggle = async (stream: StreamItem) => {
    setBusyStream(stream.streamName);
    try {
      if (stream.isJoined) await removeFromRoom(stream.streamName);
      else await addToRoom(stream.streamName);
      await fetchStreams();
    } catch {
      // The hook reports the error
    } finally {
      setBusyStream(null);
    }
  };

  const sortedStreams = React.useMemo(() => {
    const participantEntries = Object.values(participants);

    // External streams that joined the room carry the raw 'external-stream' metaData
    const externalParticipants = participantEntries.filter(
      (p) => p?.metaData === EXTERNAL_STREAM_METADATA,
    );

    const isJoined = (streamName: string) =>
      participantEntries.some(
        (p) => p.uid === streamName || parseMetaData(p.metaData)[MetaDataKeys.NAME] === streamName,
      );

    const items: StreamItem[] = streams.map((stream) => ({
      key: stream.streamGuid,
      streamName: stream.streamName,
      isJoined: isJoined(stream.streamName),
      durationMs: stream.durationMs,
      viewers: stream.subscribers,
    }));

    // Joined external streams that the external streams API did not return
    const knownNames = new Set(streams.map((stream) => stream.streamName));
    externalParticipants.forEach((p) => {
      const streamName = p.uid || p.streamName || p.streamId;
      if (!streamName || knownNames.has(streamName)) return;
      knownNames.add(streamName);
      items.push({ key: `participant-${streamName}`, streamName, isJoined: true });
    });

    return items.sort(
      (a, b) => Number(b.isJoined) - Number(a.isJoined) || a.streamName.localeCompare(b.streamName),
    );
  }, [streams, participants]);

  const joinedCount = sortedStreams.filter((stream) => stream.isJoined).length;

  return (
    <Red5Drawer
      transitionDuration={200}
      anchor="right"
      id="external-streams-drawer"
      open={open}
      variant="persistent"
      PaperProps={{ style: { pointerEvents: open ? 'auto' : 'none' } }}
    >
      <Panel>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            {t('External Streams')}
          </Typography>
          <Tooltip title={t('Refresh')}>
            <span>
              <IconButton
                id="external-streams-refresh"
                aria-label={t('Refresh')}
                onClick={() => fetchStreams()}
                disabled={loading}
                size="small"
                sx={(theme) => ({ color: themeColors(theme).text })}
              >
                {loading ? <Spinner size={18} label={t('Refreshing')} /> : <Refresh />}
              </IconButton>
            </span>
          </Tooltip>
          <CloseDrawerButton handleExternalStreamsDrawerOpen={(next: boolean) => onClose?.(next)} />
        </Box>
        <Text variant="body2" tone="muted" sx={{ mb: 2 }}>
          {t('Bring a live stream from outside into the meeting as a participant.')}
        </Text>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {loading && sortedStreams.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Spinner size={28} label={t('Loading streams')} />
            </Box>
          ) : sortedStreams.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                mt: 6,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <SensorsOff />
              <Text variant="body2">{t('No external streams are live right now')}</Text>
              <Text variant="caption" tone="muted">
                {t('Start a stream, then refresh this list.')}
              </Text>
            </Box>
          ) : (
            <>
              <Text
                variant="caption"
                tone="muted"
                component="div"
                sx={{ px: 0.5, mb: 1 }}
                id="external-streams-summary"
              >
                {t('{{joined}} of {{total}} in the meeting', {
                  joined: joinedCount,
                  total: sortedStreams.length,
                })}
              </Text>
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  m: 0,
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {sortedStreams.map((stream) => {
                  const busy = busyStream === stream.streamName;
                  const details = [
                    stream.durationMs !== undefined
                      ? t('Live {{duration}}', { duration: formatDuration(stream.durationMs) })
                      : null,
                    stream.viewers !== undefined
                      ? t('{{count}} watching', { count: stream.viewers })
                      : null,
                  ].filter(Boolean);

                  return (
                    <Box
                      component="li"
                      key={stream.key}
                      id={`external-stream-${stream.streamName}`}
                      sx={(theme) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: `${radii.container}px`,
                        backgroundColor: themeColors(theme).surface,
                        outline: stream.isJoined
                          ? `1px solid ${alpha(themeColors(theme).success, 0.4)}`
                          : 'none',
                      })}
                    >
                      <Box
                        aria-hidden
                        sx={(theme) => ({
                          width: 36,
                          height: 36,
                          flexShrink: 0,
                          borderRadius: radii.round,
                          display: 'grid',
                          placeItems: 'center',
                          color: stream.isJoined
                            ? themeColors(theme).success
                            : themeColors(theme).mutedText,
                          backgroundColor: alpha(
                            stream.isJoined ? themeColors(theme).success : themeColors(theme).text,
                            0.1,
                          ),
                        })}
                      >
                        <Videocam fontSize="small" />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Text variant="body2" component="div" sx={{ fontWeight: 500 }}>
                          <TruncatedText>{stream.streamName}</TruncatedText>
                        </Text>
                        {/* Badge and details wrap under the name rather than squeezing it */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            columnGap: 0.75,
                            rowGap: 0.5,
                            mt: 0.5,
                            minWidth: 0,
                          }}
                        >
                          {stream.isJoined && (
                            <StatusBadge tone="success">{t('In the meeting')}</StatusBadge>
                          )}
                          {details.length > 0 && (
                            <Text
                              variant="caption"
                              tone="muted"
                              component="span"
                              mono
                              sx={{
                                minWidth: 0,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {details.join(' · ')}
                            </Text>
                          )}
                        </Box>
                      </Box>

                      <Button
                        size="small"
                        shape="pill"
                        variant={stream.isJoined ? 'outlined' : 'contained'}
                        color={stream.isJoined ? 'inherit' : 'secondary'}
                        loading={busy}
                        disabled={busyStream !== null && !busy}
                        onClick={() => toggle(stream)}
                        aria-label={`${stream.isJoined ? t('Remove') : t('Add')} ${stream.streamName}`}
                        sx={{ flexShrink: 0 }}
                      >
                        {stream.isJoined ? t('Remove') : t('Add')}
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Box>
      </Panel>
    </Red5Drawer>
  );
});

ExternalStreamsDrawer.displayName = 'ExternalStreamsDrawer';

export default ExternalStreamsDrawer;
