import * as React from 'react';
import { alpha } from '@mui/material/styles';

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from '@mui/material';

import { useTranslation } from 'react-i18next';
import { SvgIcon } from '../../SvgIcon.js';
import { getDialogStyle } from '../../../styles/themeUtil.js';

interface Red5DialogTitleProps {
  children: React.ReactNode;
  onClose?: () => void;
}

interface QualityIndicatorProps {
  label: string;
  score: number;
  icon: string;
}

interface ConnectionStatsProps {
  connectionId: string;
  stats: ConnectionStatData;
  connectionType: string;
  quality?: any;
}

interface IssuesDisplayProps {
  issues: Issue[];
}

interface DiagnosticDialogProps {
  open: boolean;
  onClose: (value: boolean) => void;
  selectFocus: any;
  networkScore?: NetworkScore;
  connectionStats?: Record<string, ConnectionStatData>;
  currentIssues?: Issue[];
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

interface Issue {
  type: string;
  reason: string;
  statsSample: {
    description: string;
    severity: 'critical' | 'warning' | 'info';
    connectionId: string;
  };
}

const Red5DialogTitle: React.FC<Red5DialogTitleProps> = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle
      {...other}
      sx={{
        pr: 7,
      }}
    >
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          id="diagnostic-dialog-close-button"
          sx={{
            position: 'absolute',
            right: { xs: 10, sm: 18, md: 26 },
            top: { xs: 12, sm: 18, md: 27 },
            minWidth: 'auto',
            p: 0.5,
          }}
        >
          <SvgIcon size={20} viewBox="0 0 500 500" name={'close'} color={'#fff'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

// Helper function to get quality color
const getQualityColor = (score: number): string => {
  if (score >= 4.5) return '#4caf50'; // Green
  if (score >= 3.5) return '#8bc34a'; // Light Green
  if (score >= 2.5) return '#ffeb3b'; // Yellow
  if (score >= 1.5) return '#ff9800'; // Orange
  return '#f44336'; // Red
};

// Helper function to get quality text
const getQualityText = (score: number): string => {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Fair';
  if (score >= 1.5) return 'Poor';
  return 'Critical';
};

// Quality indicator component
const QualityIndicator: React.FC<QualityIndicatorProps> = ({ label, score, icon }) => {
  const color = getQualityColor(score);
  const text = getQualityText(score);

  return (
    <Card sx={{ mb: 2, backgroundColor: alpha(color, 0.1) }}>
      <CardContent sx={{ py: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          flexWrap="wrap"
        >
          <Box display="flex" alignItems="center" sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {icon}
            </Typography>
            <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
              {label}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Chip
              label={`${score.toFixed(1)} - ${text}`}
              size="small"
              sx={{
                backgroundColor: color,
                color: 'white',
                fontWeight: 'bold',
                width: { xs: '100%', sm: 'auto' },
                '& .MuiChip-label': {
                  overflow: 'unset',
                  whiteSpace: 'normal',
                },
              }}
            />
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(score / 5) * 100}
          sx={{
            mt: 1,
            backgroundColor: alpha(color, 0.2),
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

// Connection stats component
const ConnectionStats: React.FC<ConnectionStatsProps> = ({
  connectionId,
  stats,
  connectionType,
}) => {
  const getConnectionIcon = (type: string): string => {
    if (type.includes('publisher')) return '📤';
    if (type.includes('subscriber')) return '📥';
    if (type.includes('screen-share')) return '🖥️';
    return '🔗';
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatBitrate = (bps?: number): string => {
    if (!bps) return '0 bps';
    const k = 1000;
    const sizes = ['bps', 'kbps', 'Mbps'];
    const i = Math.floor(Math.log(bps) / Math.log(k));
    return parseFloat((bps / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}
        >
          {getConnectionIcon(connectionType)} {connectionId}
          <Chip
            label={connectionType}
            size="small"
            sx={{
              ml: 1,
              fontSize: '0.7rem',
              '& .MuiChip-label': {
                overflow: 'unset',
                whiteSpace: 'normal',
              },
            }}
          />
        </Typography>

        <Grid container spacing={2}>
          {/* Video Stats */}
          {(stats.outboundVideo || stats.inboundVideo) && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                📹 Video
              </Typography>
              {stats.outboundVideo && (
                <Box>
                  <Typography variant="body2" fontSize="0.75rem">
                    📤 {formatBitrate(stats.quality?.bitrate)} •{' '}
                    {stats.outboundVideo.framesPerSecond || 0} fps
                  </Typography>
                  <Typography variant="body2" fontSize="0.75rem">
                    📦 {stats.outboundVideo.packetsSent || 0} sent •{' '}
                    {stats.outboundVideo.packetsLost || 0} lost
                  </Typography>
                  <Typography variant="body2" fontSize="0.75rem">
                    📺 {stats.outboundVideo.frameWidth}×{stats.outboundVideo.frameHeight}
                  </Typography>
                </Box>
              )}
              {stats.inboundVideo && (
                <Box>
                  <Typography variant="body2" fontSize="0.75rem">
                    📥 {formatBitrate(stats.quality?.bitrate)} •{' '}
                    {stats.inboundVideo.framesPerSecond || 0} fps
                  </Typography>
                  <Typography variant="body2" fontSize="0.75rem">
                    📦 {stats.inboundVideo.packetsReceived || 0} recv •{' '}
                    {stats.inboundVideo.packetsLost || 0} lost
                  </Typography>
                  <Typography variant="body2" fontSize="0.75rem">
                    📺 {stats.inboundVideo.frameWidth}×{stats.inboundVideo.frameHeight}
                  </Typography>
                </Box>
              )}
            </Grid>
          )}

          {/* Audio Stats */}
          {(stats.outboundAudio || stats.inboundAudio) && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                🔊 Audio
              </Typography>
              {stats.outboundAudio && (
                <Box>
                  <Typography variant="body2" fontSize="0.75rem">
                    📤 {formatBytes(stats.outboundAudio.bytesSent)}
                  </Typography>
                  <Typography variant="body2" fontSize="0.75rem">
                    📦 {stats.outboundAudio.packetsSent || 0} sent
                  </Typography>
                </Box>
              )}
              {stats.inboundAudio && (
                <Box>
                  <Typography variant="body2" fontSize="0.75rem">
                    📥 {formatBytes(stats.inboundAudio.bytesReceived)}
                  </Typography>
                  <Typography variant="body2" fontSize="0.75rem">
                    📦 {stats.inboundAudio.packetsReceived || 0} recv
                  </Typography>
                  <Typography variant="body2" fontSize="0.75rem">
                    📊 Jitter: {stats.inboundAudio.jitter?.toFixed(1) || 0}ms
                  </Typography>
                </Box>
              )}
            </Grid>
          )}

          {/* Network Stats */}
          {stats.candidatePairs && stats.candidatePairs.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                🌐 Network
              </Typography>
              {stats.candidatePairs.map((pair, index) => (
                <Typography key={index} variant="body2" fontSize="0.75rem">
                  🔄 RTT: {pair.rtt?.toFixed(0) || 0}ms • 📤 {formatBytes(pair.bytesSent)} • 📥{' '}
                  {formatBytes(pair.bytesReceived)}
                </Typography>
              ))}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Issues component
const IssuesDisplay: React.FC<IssuesDisplayProps> = ({ issues }) => {
  const getIssueIcon = (_type: string, reason: string): string => {
    if (reason === 'high-packet-loss') return '📉';
    if (reason === 'high-rtt') return '🐌';
    if (reason === 'high-jitter') return '📳';
    if (reason === 'video-freeze') return '🧊';
    if (reason === 'audio-silence') return '🔇';
    return '⚠️';
  };

  const getIssueSeverityColor = (severity: string): string => {
    if (severity === 'critical') return '#f44336';
    if (severity === 'warning') return '#ff9800';
    return '#2196f3';
  };

  if (!issues || issues.length === 0) {
    return (
      <Card sx={{ mb: 2, backgroundColor: alpha('#4caf50', 0.1) }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
            ✅ No Issues Detected
          </Typography>
          <Typography variant="body2" color="textSecondary">
            All connections are performing well
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          🚨 Issues Detected ({issues.length})
        </Typography>
        <List dense>
          {issues.map((issue, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Typography>{getIssueIcon(issue.type, issue.reason)}</Typography>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
                    <Typography variant="body2" sx={{ mr: 1, wordBreak: 'break-word' }}>
                      {issue.statsSample.description}
                    </Typography>
                    <Chip
                      label={issue.statsSample.severity}
                      size="small"
                      sx={{
                        backgroundColor: getIssueSeverityColor(issue.statsSample.severity),
                        color: 'white',
                        fontSize: '0.7rem',
                        '& .MuiChip-label': {
                          overflow: 'unset',
                          whiteSpace: 'normal',
                        },
                      }}
                    />
                  </Box>
                }
                secondary={`Connection: ${issue.statsSample.connectionId}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export function DiagnosticDialog({
  open,
  onClose,
  networkScore,
  connectionStats,
  currentIssues,
  printStatLogs,
  setPrintStatLogs,
}: DiagnosticDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClose = () => {
    onClose(!open);
  };

  const handlePrintStatLogsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setPrintStatLogs(checked);
  };

  // Default values if no data provided
  const defaultNetworkScore: NetworkScore = {
    inbound: 0,
    outbound: 0,
    statsSamples: {},
  };

  const scores = networkScore || defaultNetworkScore;
  const stats = connectionStats || {};
  const issues = currentIssues || [];

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      fullScreen={isMobile}
      maxWidth={'md'} // Changed to md for more space
      PaperProps={{
        sx: {
          ...getDialogStyle(theme),
          width: { xs: '100%', sm: 'auto' },
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 2 },
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(0.5px)',
        },
      }}
    >
      <Red5DialogTitle onClose={handleClose}>{t('Network Diagnostic')} 📊</Red5DialogTitle>
      <DialogContent
        sx={{ px: { xs: 1.5, sm: 3 }, maxHeight: { xs: '100vh', sm: '70vh' }, overflowY: 'auto' }}
      >
        <Box component="div" sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Overall Network Quality */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            📡 Network Quality Overview
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <QualityIndicator label="Inbound Quality" score={scores.inbound} icon="📥" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <QualityIndicator label="Outbound Quality" score={scores.outbound} icon="📤" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Current Issues */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            🚨 Current Issues
          </Typography>
          <IssuesDisplay issues={issues} />

          <Divider sx={{ my: 2 }} />

          {/* Connection Statistics */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            🔗 Connection Statistics
          </Typography>

          {Object.keys(scores.statsSamples).length === 0 ? (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  📡 No active connections to monitor
                </Typography>
              </CardContent>
            </Card>
          ) : (
            Object.entries(scores.statsSamples).map(([connectionId, connectionData]) => (
              <ConnectionStats
                key={connectionId}
                connectionId={connectionId}
                stats={stats[connectionId] || {}}
                connectionType={stats[connectionId]?.connectionType || 'unknown'}
                quality={connectionData}
              />
            ))
          )}

          {/* Summary Stats */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                📈 Session Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Active Connections
                  </Typography>
                  <Typography variant="h6">{Object.keys(scores.statsSamples).length}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Current Issues
                  </Typography>
                  <Typography variant="h6" color={issues.length > 0 ? 'error' : 'success'}>
                    {issues.length}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ mr: 0.5 }}>
                    Overall Status
                  </Typography>
                  <Chip
                    label={issues.length === 0 ? 'Healthy' : 'Issues Detected'}
                    size="small"
                    color={issues.length === 0 ? 'success' : 'error'}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      '& .MuiChip-label': {
                        overflow: 'unset',
                        whiteSpace: 'normal',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Debug Options */}
          <Card sx={{ mt: 2, backgroundColor: alpha('#2196f3', 0.05) }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                🔧 Debug Options
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={printStatLogs}
                    onChange={handlePrintStatLogsChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">📋 Print detailed statistics to console</Typography>
                }
              />
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
