import * as React from 'react';
import { useState, useCallback } from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, useTheme, Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Typography, TextField, Button, Box, CircularProgress, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from '../styles/themeUtil';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface TranscriptionDrawerProps {
  open?: boolean;
  onClose?: (open: boolean) => void;
  fetchTranscriptions: (startTime: number, endTime: number) => Promise<any>;
  loading: boolean;
  error: string | null;
  data: any | null;
}

const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => {
  return getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false) as any;
});

const InfoGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor?.[60],
  borderRadius: 10,
  width: '100%',
  height: '100%',
  [theme.breakpoints.down('sm')]: {
    width: '100vw',
  },
}));

const JsonContainer = styled(Box)(({ theme }: { theme: Theme }) => ({
  background: 'rgba(0, 0, 0, 0.2)',
  padding: 12,
  borderRadius: 8,
  overflow: 'auto',
  maxHeight: 'calc(100vh - 300px)',
  marginTop: 16,
  '& pre': {
    margin: 0,
    fontSize: '0.8rem',
    color: theme.palette.text.primary,
  },
}));

const TranscriptionDrawer = React.memo<TranscriptionDrawerProps>((props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Default to last 30 minutes
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const formatToLocalDatetime = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [startTime, setStartTime] = useState(formatToLocalDatetime(thirtyMinutesAgo));
  const [endTime, setEndTime] = useState(formatToLocalDatetime(now));

  const handleFetch = useCallback(() => {
    const startTs = new Date(startTime).getTime();
    const endTs = new Date(endTime).getTime();
    props.fetchTranscriptions(startTs, endTs);
  }, [startTime, endTime, props.fetchTranscriptions]);

  const handleCopy = useCallback(() => {
    if (props.data) {
      navigator.clipboard.writeText(JSON.stringify(props.data, null, 2));
    }
  }, [props.data]);

  const handleCopyForLLM = useCallback(() => {
    if (props.data?.transcriptionsByUser) {
      let output = '';
      const allTranscriptions: any[] = [];

      Object.entries(props.data.transcriptionsByUser).forEach(
        ([user, userCaptions]: [string, any]) => {
          userCaptions.forEach((cap: any) => {
            allTranscriptions.push({
              ...cap,
              user,
            });
          });
        },
      );

      // Sort by timestamp
      allTranscriptions.sort((a, b) => a.timestamp - b.timestamp);

      allTranscriptions.forEach((cap) => {
        const time = new Date(cap.timestamp).toLocaleTimeString();
        output += `[${time}] ${cap.user}: ${cap.text}\n`;
      });

      navigator.clipboard.writeText(output);
    }
  }, [props.data]);

  return (
    <Red5Drawer
      transitionDuration={200}
      anchor="right"
      id="transcription-drawer"
      open={props?.open}
      variant="persistent"
    >
      <InfoGrid
        container
        direction="column"
        style={{
          flexWrap: 'nowrap',
          height: '100%',
          overflow: 'hidden',
          background: theme.palette.themeColor?.[60],
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" component="div">
            {t('Transcriptions')}
          </Typography>
          <CloseDrawerButton handleInfoDrawerOpen={() => props?.onClose?.(false)} />
        </Grid>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('Start Time')}
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label={t('End Time')}
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <Button variant="contained" onClick={handleFetch} disabled={props.loading} fullWidth>
            {props.loading ? <CircularProgress size={24} /> : t('Fetch Transcriptions')}
          </Button>
        </Box>

        {props.error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {props.error}
          </Typography>
        )}

        {props.data && (
          <>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}
            >
              <Typography variant="subtitle2">
                {t('Results')} ({props.data.totalTranscriptionCount || 0})
              </Typography>
              <Box>
                <IconButton
                  onClick={handleCopyForLLM}
                  size="small"
                  title={t('Copy for LLM')}
                  sx={{ mr: 1 }}
                >
                  <AutoFixHighIcon fontSize="small" color="primary" />
                </IconButton>
                <IconButton onClick={handleCopy} size="small" title={t('Copy JSON')}>
                  <ContentCopyIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            </Box>
            <JsonContainer>
              <pre>{JSON.stringify(props.data, null, 2)}</pre>
            </JsonContainer>
          </>
        )}
      </InfoGrid>
    </Red5Drawer>
  );
});

TranscriptionDrawer.displayName = 'TranscriptionDrawer';

export default TranscriptionDrawer;
