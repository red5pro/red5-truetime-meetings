import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, Theme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { ContentCopy, DataObject, Subject } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import { Alert, Button, FormField, Heading, Input, Text, radii, themeColors } from 'truetime-ui';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from '../styles/themeUtil';

interface TranscriptionEntry {
  text: string;
  timestamp: number;
}

interface TranscriptionData {
  totalTranscriptionCount?: number;
  transcriptionsByUser?: Record<string, TranscriptionEntry[]>;
}

interface TranscriptionDrawerProps {
  open?: boolean;
  onClose?: (open: boolean) => void;
  fetchTranscriptions: (startTime: number, endTime: number) => Promise<any>;
  loading: boolean;
  error: string | null;
  data: TranscriptionData | null;
}

interface TranscriptLine extends TranscriptionEntry {
  speaker: string;
}

const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => {
  return getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false) as any;
});

const Panel = styled(Box)(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor?.[60],
  borderRadius: 10,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    width: '100vw',
  },
}));

/** Ranges offered as one click, in minutes before now */
const PRESETS = [15, 30, 60] as const;
type Range = (typeof PRESETS)[number] | 'custom';

/** A Date as the value of a datetime-local input (local time, to the minute) */
const toLocalInput = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

/** Every speaker's lines in one list, in the order they were said */
const toTranscript = (data: TranscriptionData | null): TranscriptLine[] =>
  Object.entries(data?.transcriptionsByUser ?? {})
    .flatMap(([speaker, entries]) => entries.map((entry) => ({ ...entry, speaker })))
    .sort((a, b) => a.timestamp - b.timestamp);

const TranscriptionDrawer = React.memo<TranscriptionDrawerProps>((props) => {
  const { fetchTranscriptions, data, loading, error } = props;
  const { t } = useTranslation();

  const [range, setRange] = useState<Range>(30);
  const [customStart, setCustomStart] = useState(() =>
    toLocalInput(new Date(Date.now() - 30 * 60 * 1000)),
  );
  const [customEnd, setCustomEnd] = useState(() => toLocalInput(new Date()));

  const customInvalid =
    range === 'custom' && new Date(customStart).getTime() >= new Date(customEnd).getTime();

  const handleFetch = useCallback(() => {
    if (range === 'custom') {
      fetchTranscriptions(new Date(customStart).getTime(), new Date(customEnd).getTime());
    } else {
      const end = Date.now();
      fetchTranscriptions(end - range * 60 * 1000, end);
    }
  }, [range, customStart, customEnd, fetchTranscriptions]);

  const transcript = useMemo(() => toTranscript(data), [data]);

  const copy = useCallback(
    async (text: string, done: string) => {
      try {
        await navigator.clipboard.writeText(text);
        enqueueSnackbar(done, { variant: 'info', autoHideDuration: 1500 });
      } catch {
        enqueueSnackbar(t("Couldn't copy to the clipboard"), {
          variant: 'error',
          autoHideDuration: 2500,
        });
      }
    },
    [t],
  );

  const copyTranscript = () =>
    copy(
      transcript
        .map(
          (line) =>
            `[${new Date(line.timestamp).toLocaleTimeString()}] ${line.speaker}: ${line.text}`,
        )
        .join('\n'),
      t('Transcript copied'),
    );

  const copyJson = () => copy(JSON.stringify(data, null, 2), t('JSON copied'));

  return (
    <Red5Drawer
      anchor="right"
      id="transcription-drawer"
      open={props?.open}
      variant="persistent"
      PaperProps={{ style: { pointerEvents: props?.open ? 'auto' : 'none' } }}
    >
      <Panel>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {t('Transcriptions')}
          </Typography>
          <CloseDrawerButton handleInfoDrawerOpen={() => props?.onClose?.(false)} />
        </Box>

        {/* Which part of the meeting to fetch */}
        <Box component="section" aria-labelledby="transcription-range" sx={{ mb: 2 }}>
          <Heading
            id="transcription-range"
            level={3}
            variant="subtitle2"
            sx={(theme) => ({ color: themeColors(theme).mutedText, mb: 1 })}
          >
            {t('Time range')}
          </Heading>
          <Box
            role="group"
            aria-labelledby="transcription-range"
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}
          >
            {[...PRESETS, 'custom' as const].map((option) => {
              const selected = range === option;
              return (
                <Button
                  key={option}
                  id={`transcription-range-${option}`}
                  size="small"
                  shape="pill"
                  color={selected ? 'primary' : 'secondary'}
                  aria-pressed={selected}
                  onClick={() => setRange(option)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  {option === 'custom'
                    ? t('Custom')
                    : option === 60
                      ? t('1 hour')
                      : t('{{minutes}} min', { minutes: option })}
                </Button>
              );
            })}
          </Box>

          {range === 'custom' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
              <FormField label={t('From')} id="transcription-start">
                <Input
                  type="datetime-local"
                  size="small"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                />
              </FormField>
              <FormField
                label={t('To')}
                id="transcription-end"
                error={customInvalid}
                helperText={customInvalid ? t('Must be after the start') : undefined}
              >
                <Input
                  type="datetime-local"
                  size="small"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                />
              </FormField>
            </Box>
          )}

          <Button
            id="transcription-fetch-button"
            fullWidth
            shape="pill"
            loading={loading}
            disabled={customInvalid}
            onClick={handleFetch}
            sx={{ mt: 2 }}
          >
            {t('Get transcript')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {data && (
          <Box
            component="section"
            aria-labelledby="transcription-results"
            sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Heading
                id="transcription-results"
                level={3}
                variant="subtitle2"
                sx={(theme) => ({ color: themeColors(theme).mutedText })}
              >
                {t('Transcript')} · {transcript.length}
              </Heading>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  id="transcription-copy-text"
                  size="small"
                  variant="text"
                  color="inherit"
                  startIcon={<ContentCopy fontSize="small" />}
                  disabled={transcript.length === 0}
                  onClick={copyTranscript}
                >
                  {t('Copy transcript')}
                </Button>
                <Button
                  id="transcription-copy-json"
                  size="small"
                  variant="text"
                  color="inherit"
                  startIcon={<DataObject fontSize="small" />}
                  onClick={copyJson}
                >
                  {t('JSON')}
                </Button>
              </Box>
            </Box>

            {transcript.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  textAlign: 'center',
                  color: 'text.secondary',
                  py: 4,
                }}
              >
                <Subject />
                <Text variant="body2" tone="muted">
                  {t('Nothing was transcribed in this time range')}
                </Text>
              </Box>
            ) : (
              <Box
                component="ol"
                id="transcription-lines"
                sx={(theme) => ({
                  listStyle: 'none',
                  m: 0,
                  mt: 1,
                  p: 1.5,
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  borderRadius: `${radii.container}px`,
                  backgroundColor: themeColors(theme).surface,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                })}
              >
                {transcript.map((line, index) => (
                  <Box component="li" key={`${line.speaker}-${line.timestamp}-${index}`}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Text variant="body2" component="span" sx={{ fontWeight: 600 }}>
                        {line.speaker}
                      </Text>
                      <Text variant="caption" component="span" tone="muted" mono>
                        {timeFormat.format(new Date(line.timestamp))}
                      </Text>
                    </Box>
                    <Text variant="body2" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
                      {line.text}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Panel>
    </Red5Drawer>
  );
});

TranscriptionDrawer.displayName = 'TranscriptionDrawer';

export default TranscriptionDrawer;
