import * as React from 'react';
import { alpha, type Theme } from '@mui/material/styles';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AcUnit,
  CallMade,
  CallReceived,
  CheckCircleOutline,
  Close,
  GraphicEq,
  Hub,
  NoiseAware,
  ScreenShare,
  Speed,
  TrendingDown,
  VolumeOff,
  WarningAmber,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Checkbox,
  Heading,
  Spinner,
  StatusBadge,
  Text,
  TruncatedText,
  monoText,
  radii,
  themeColors,
  type StatusTone,
} from 'truetime-ui';
import { getDialogStyle } from '../../../styles/themeUtil.js';
import type { NoiseSuppressionStatus } from '../../../hooks/useNoiseSuppression';
import { getNoiseSuppressionPercent } from '../../../utils/conferenceConfig';

interface DiagnosticDialogProps {
  open: boolean;
  onClose: (value: boolean) => void;
  selectFocus: any;
  networkScore?: NetworkScore;
  connectionStats?: Record<string, ConnectionStatData>;
  currentIssues?: Issue[];
  noiseSuppressionEnabled?: boolean;
  noiseSuppressionStatus?: NoiseSuppressionStatus;
  printStatLogs: boolean;
  setPrintStatLogs: (value: boolean) => void;
}

interface NetworkScore {
  inbound: number;
  outbound: number;
  statsSamples: Record<string, any>;
}

interface ConnectionStatData {
  connectionType?: string;
  outboundVideo?: {
    framesPerSecond?: number;
    packetsSent?: number;
    packetsLost?: number;
    frameWidth?: number;
    frameHeight?: number;
    bytesSent?: number;
  };
  inboundVideo?: {
    framesPerSecond?: number;
    packetsReceived?: number;
    packetsLost?: number;
    frameWidth?: number;
    frameHeight?: number;
    bytesReceived?: number;
  };
  outboundAudio?: {
    bytesSent?: number;
    packetsSent?: number;
  };
  inboundAudio?: {
    bytesReceived?: number;
    packetsReceived?: number;
    jitter?: number;
  };
  candidatePairs?: {
    rtt?: number;
    bytesSent?: number;
    bytesReceived?: number;
  }[];
  quality?: {
    bitrate?: number;
  };
}

type Severity = 'critical' | 'warning' | 'info';

interface Issue {
  type: string;
  reason: string;
  statsSample: {
    description: string;
    severity: Severity;
    connectionId: string;
  };
}

// --- Formatting -------------------------------------------------------------------------------

const formatBytes = (bytes?: number): string => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
};

const formatBitrate = (bps?: number): string => {
  if (!bps) return '0 bps';
  const units = ['bps', 'kbps', 'Mbps', 'Gbps'];
  const i = Math.min(Math.floor(Math.log(bps) / Math.log(1000)), units.length - 1);
  return `${parseFloat((bps / Math.pow(1000, i)).toFixed(1))} ${units[i]}`;
};

const formatCount = (value?: number): string => (value ?? 0).toLocaleString();

/** Lost packets as a share of all packets that were meant to arrive (or be sent) */
const formatLoss = (lost?: number, delivered?: number): string => {
  const total = (lost ?? 0) + (delivered ?? 0);
  if (!total) return '0%';
  return `${(((lost ?? 0) / total) * 100).toFixed(1)}%`;
};

const formatResolution = (width?: number, height?: number): string =>
  width && height ? `${width}×${height}` : '—';

// --- Quality ----------------------------------------------------------------------------------

interface QualityLevel {
  label: string;
  tone: StatusTone;
}

/** Network score (0–5) as a label and a status tone */
const qualityLevel = (score: number): QualityLevel => {
  if (score >= 4.5) return { label: 'Excellent', tone: 'success' };
  if (score >= 3.5) return { label: 'Good', tone: 'success' };
  if (score >= 2.5) return { label: 'Fair', tone: 'warning' };
  if (score >= 1.5) return { label: 'Poor', tone: 'error' };
  return { label: 'Critical', tone: 'error' };
};

const toneColor = (theme: Theme, tone: StatusTone): string => {
  const colors = themeColors(theme);
  if (tone === 'success') return colors.success;
  if (tone === 'warning') return colors.warning;
  if (tone === 'error') return colors.error;
  return colors.mutedText;
};

const severityTone: Record<Severity, StatusTone> = {
  critical: 'error',
  warning: 'warning',
  info: 'neutral',
};

const issueIcon = (reason: string): React.ReactNode => {
  switch (reason) {
    case 'high-packet-loss':
      return <TrendingDown fontSize="small" />;
    case 'high-rtt':
      return <Speed fontSize="small" />;
    case 'high-jitter':
      return <GraphicEq fontSize="small" />;
    case 'video-freeze':
      return <AcUnit fontSize="small" />;
    case 'audio-silence':
      return <VolumeOff fontSize="small" />;
    default:
      return <WarningAmber fontSize="small" />;
  }
};

const connectionIcon = (type: string): React.ReactNode => {
  if (type.includes('screen-share')) return <ScreenShare fontSize="small" />;
  if (type.includes('publisher')) return <CallMade fontSize="small" />;
  if (type.includes('subscriber')) return <CallReceived fontSize="small" />;
  return <Hub fontSize="small" />;
};

// --- Building blocks --------------------------------------------------------------------------

function Section({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box component="section" aria-labelledby={id}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Heading
          id={id}
          level={3}
          variant="subtitle2"
          sx={(theme) => ({
            color: themeColors(theme).mutedText,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: 12,
          })}
        >
          {title}
        </Heading>
        {action}
      </Box>
      {children}
    </Box>
  );
}

/** A measurement: a small muted label over a fixed-width value */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Text tone="muted" variant="caption" component="div">
        {label}
      </Text>
      <Text variant="body2" component="div" mono sx={{ mt: 0.25 }}>
        {value}
      </Text>
    </Box>
  );
}

function QualityTile({
  icon,
  label,
  score,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
}) {
  const { t } = useTranslation();
  const level = qualityLevel(score);
  const filled = Math.round(Math.max(0, Math.min(5, score)));

  return (
    <Card padding="sm" variant="plain">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        {icon}
        <Text variant="body2" tone="muted">
          {label}
        </Text>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1.5 }}>
        <Text component="span" sx={{ ...monoText, fontSize: 32, fontWeight: 600, lineHeight: 1 }}>
          {score.toFixed(1)}
        </Text>
        <Text component="span" tone="muted" variant="body2" mono>
          / 5
        </Text>
        <Box sx={{ ml: 'auto' }}>
          <StatusBadge tone={level.tone}>{t(level.label)}</StatusBadge>
        </Box>
      </Box>
      {/* Five-step meter; decorative, the score above is the value */}
      <Box aria-hidden sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
        {[0, 1, 2, 3, 4].map((step) => (
          <Box
            key={step}
            sx={(theme) => ({
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                step < filled ? toneColor(theme, level.tone) : alpha(themeColors(theme).text, 0.1),
            })}
          />
        ))}
      </Box>
    </Card>
  );
}

function IssuesList({ issues }: { issues: Issue[] }) {
  const { t } = useTranslation();

  if (issues.length === 0) {
    return (
      <Card padding="sm" variant="plain">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={(theme) => ({ color: themeColors(theme).success, display: 'flex' })}>
            <CheckCircleOutline />
          </Box>
          <Box>
            <Text variant="body2">{t('No issues detected')}</Text>
            <Text variant="caption" tone="muted">
              {t('All connections are performing well')}
            </Text>
          </Box>
        </Box>
      </Card>
    );
  }

  return (
    <Card padding="none" variant="plain" component="ul" sx={{ listStyle: 'none', m: 0 }}>
      {issues.map((issue, index) => {
        const tone = severityTone[issue.statsSample.severity] ?? 'neutral';
        return (
          <Box
            component="li"
            key={`${issue.statsSample.connectionId}-${issue.reason}-${index}`}
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              px: 2,
              py: 1.5,
              '& + &': { borderTop: `1px solid ${alpha(themeColors(theme).text, 0.08)}` },
            })}
          >
            <Box sx={(theme) => ({ color: toneColor(theme, tone), display: 'flex', mt: 0.25 })}>
              {issueIcon(issue.reason)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Text variant="body2" sx={{ wordBreak: 'break-word' }}>
                {issue.statsSample.description}
              </Text>
              <Text variant="caption" tone="muted" mono component="div">
                <TruncatedText>{issue.statsSample.connectionId}</TruncatedText>
              </Text>
            </Box>
            <StatusBadge tone={tone}>{t(issue.statsSample.severity)}</StatusBadge>
          </Box>
        );
      })}
    </Card>
  );
}

function ConnectionCard({ id, stats }: { id: string; stats: ConnectionStatData }) {
  const { t } = useTranslation();
  const type = stats.connectionType || 'unknown';
  const rtt = stats.candidatePairs?.find((pair) => pair.rtt !== undefined)?.rtt;

  const groups: { title: string; metrics: { label: string; value: string }[] }[] = [];
  if (stats.outboundVideo) {
    const video = stats.outboundVideo;
    groups.push({
      title: t('Video sent'),
      metrics: [
        { label: t('Bitrate'), value: formatBitrate(stats.quality?.bitrate) },
        { label: t('Frame rate'), value: `${video.framesPerSecond ?? 0} fps` },
        { label: t('Resolution'), value: formatResolution(video.frameWidth, video.frameHeight) },
        { label: t('Packet loss'), value: formatLoss(video.packetsLost, video.packetsSent) },
      ],
    });
  }
  if (stats.inboundVideo) {
    const video = stats.inboundVideo;
    groups.push({
      title: t('Video received'),
      metrics: [
        { label: t('Bitrate'), value: formatBitrate(stats.quality?.bitrate) },
        { label: t('Frame rate'), value: `${video.framesPerSecond ?? 0} fps` },
        { label: t('Resolution'), value: formatResolution(video.frameWidth, video.frameHeight) },
        { label: t('Packet loss'), value: formatLoss(video.packetsLost, video.packetsReceived) },
      ],
    });
  }
  if (stats.outboundAudio) {
    groups.push({
      title: t('Audio sent'),
      metrics: [
        { label: t('Data'), value: formatBytes(stats.outboundAudio.bytesSent) },
        { label: t('Packets'), value: formatCount(stats.outboundAudio.packetsSent) },
      ],
    });
  }
  if (stats.inboundAudio) {
    groups.push({
      title: t('Audio received'),
      metrics: [
        { label: t('Data'), value: formatBytes(stats.inboundAudio.bytesReceived) },
        { label: t('Packets'), value: formatCount(stats.inboundAudio.packetsReceived) },
        { label: t('Jitter'), value: `${(stats.inboundAudio.jitter ?? 0).toFixed(1)} ms` },
      ],
    });
  }

  return (
    <Card padding="sm" variant="plain">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{connectionIcon(type)}</Box>
        <Text variant="body2" mono component="div" sx={{ minWidth: 0, flex: 1 }}>
          <TruncatedText>{id}</TruncatedText>
        </Text>
        <StatusBadge tone="neutral">{type}</StatusBadge>
      </Box>

      {rtt !== undefined && (
        <Box sx={{ display: 'flex', gap: 3, mt: 1.5 }}>
          <Metric label={t('Round trip')} value={`${rtt.toFixed(0)} ms`} />
        </Box>
      )}

      {groups.map((group) => (
        <Box key={group.title} sx={{ mt: 2 }}>
          <Text variant="caption" sx={{ fontWeight: 600 }} component="div">
            {group.title}
          </Text>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 1.5,
              mt: 1,
            }}
          >
            {group.metrics.map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </Box>
        </Box>
      ))}
    </Card>
  );
}

/** Noise suppression model state, and whether it's on */
function NoiseSuppressionRow({
  enabled,
  status = 'idle',
}: {
  enabled?: boolean;
  status?: NoiseSuppressionStatus;
}) {
  const { t } = useTranslation();

  const states: Record<
    NoiseSuppressionStatus,
    { tone: StatusTone; label: string; note: string; busy?: boolean }
  > = {
    idle: {
      tone: 'neutral',
      label: t('Waiting'),
      note: t('Starts when your microphone is on'),
    },
    downloading: {
      tone: 'warning',
      label: t('Downloading'),
      note: t('Downloading the noise suppression model'),
      busy: true,
    },
    loading: {
      tone: 'warning',
      label: t('Loading'),
      note: t('Starting the noise suppression model'),
      busy: true,
    },
    ready: enabled
      ? {
          tone: 'success',
          label: t('On'),
          note: t('Removing about {{percent}}% of background noise', {
            percent: getNoiseSuppressionPercent(),
          }),
        }
      : { tone: 'neutral', label: t('Off'), note: t('Turned off in Audio Settings') },
    unavailable: {
      tone: 'error',
      label: t('Unavailable'),
      note: t("The model couldn't load; it tries again when the microphone changes"),
    },
  };
  const state = states[status];

  return (
    <Card padding="sm" variant="plain">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>
          <NoiseAware />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Text variant="body2">{t('Noise suppression')}</Text>
          <Text variant="caption" tone="muted" component="div">
            {state.note}
          </Text>
        </Box>
        <StatusBadge tone={state.tone}>
          {state.busy && <Spinner size={10} label={state.label} />}
          {state.label}
        </StatusBadge>
      </Box>
    </Card>
  );
}

// --- Dialog -----------------------------------------------------------------------------------

export function DiagnosticDialog({
  open,
  onClose,
  networkScore,
  connectionStats,
  currentIssues,
  noiseSuppressionEnabled,
  noiseSuppressionStatus,
  printStatLogs,
  setPrintStatLogs,
}: DiagnosticDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const scores = networkScore ?? { inbound: 0, outbound: 0, statsSamples: {} };
  const stats = connectionStats ?? {};
  const issues = currentIssues ?? [];
  const connectionIds = Object.keys(scores.statsSamples);
  const hasCritical = issues.some((issue) => issue.statsSample.severity === 'critical');

  const handleClose = () => onClose(!open);

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      aria-labelledby="diagnostic-dialog-title"
      PaperProps={{
        sx: {
          ...getDialogStyle(theme),
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: `${radii.container}px` },
          px: { xs: 2, sm: 4 },
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(0.5px)',
        },
      }}
    >
      <DialogTitle id="diagnostic-dialog-title" sx={{ pr: 6, pb: 1 }}>
        {t('Diagnostics')}
        <IconButton
          aria-label={t('Close')}
          onClick={handleClose}
          id="diagnostic-dialog-close-button"
          sx={{ position: 'absolute', right: { xs: 8, sm: 24 }, top: { xs: 16, sm: 24 } }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      {/* At a glance: overall state and how many connections are measured */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <StatusBadge tone={issues.length === 0 ? 'success' : hasCritical ? 'error' : 'warning'}>
          {issues.length === 0
            ? t('Healthy')
            : issues.length === 1
              ? t('1 issue')
              : t('{{count}} issues', { count: issues.length })}
        </StatusBadge>
        <Text variant="body2" tone="muted">
          {connectionIds.length === 1
            ? t('1 connection')
            : t('{{count}} connections', { count: connectionIds.length })}
        </Text>
      </Box>

      <DialogContent
        sx={{
          maxHeight: { xs: 'none', sm: '70vh' },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          pb: 3,
        }}
      >
        <Section id="diagnostic-quality" title={t('Connection quality')}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            <QualityTile
              icon={<CallMade fontSize="small" />}
              label={t('Upload')}
              score={scores.outbound}
            />
            <QualityTile
              icon={<CallReceived fontSize="small" />}
              label={t('Download')}
              score={scores.inbound}
            />
          </Box>
        </Section>

        <Section id="diagnostic-issues" title={t('Issues')}>
          <IssuesList issues={issues} />
        </Section>

        <Section id="diagnostic-audio" title={t('Audio')}>
          <NoiseSuppressionRow enabled={noiseSuppressionEnabled} status={noiseSuppressionStatus} />
        </Section>

        <Section id="diagnostic-connections" title={t('Connections')}>
          {connectionIds.length === 0 ? (
            <Card padding="sm" variant="plain">
              <Text variant="body2" tone="muted">
                {t('No active connections to measure yet')}
              </Text>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {connectionIds.map((id) => (
                <ConnectionCard key={id} id={id} stats={stats[id] ?? {}} />
              ))}
            </Box>
          )}
        </Section>

        <Section id="diagnostic-debug" title={t('Troubleshooting')}>
          <Checkbox
            id="diagnostic-print-stats"
            checked={printStatLogs}
            onChange={(event) => setPrintStatLogs(event.target.checked)}
            label={t('Print detailed statistics to the browser console')}
          />
        </Section>
      </DialogContent>
    </Dialog>
  );
}
