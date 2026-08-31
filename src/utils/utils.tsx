import React from 'react';
import { USER_ROLES } from '../constants/userRoles';
import { MetaDataKeys } from '../constants/metaDataKeys';
import { peerConfig } from '../constants/config';
import { getRuntimeConfig } from './configStore';

// Types
interface QualityIssue {
  type: 'network' | 'media';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface QualityMetrics {
  packetLossPercent?: number;
  rtt?: number;
  jitter?: number;
  framesPerSecond?: number;
  framesDroppedPercent?: number;
  bitrate?: number;
  resolution?: string;
  codec?: string;
}

interface VideoStats {
  packetsReceived?: number;
  packetsLost?: number;
  packetsSent?: number;
  framesPerSecond?: number;
  framesReceived?: number;
  framesDropped?: number;
  bytesReceived?: number;
  bytesSent?: number;
  frameWidth?: number;
  frameHeight?: number;
  jitter?: number;
}

interface AudioStats {
  packetsReceived?: number;
  packetsLost?: number;
  packetsSent?: number;
  bytesReceived?: number;
  bytesSent?: number;
  jitter?: number;
}

interface CandidatePair {
  rtt?: number;
  bytesSent?: number;
  bytesReceived?: number;
}

interface Codec {
  mimeType: string;
}

interface ConnectionStats {
  connectionType?: string;
  inboundVideo?: VideoStats;
  outboundVideo?: VideoStats;
  inboundAudio?: AudioStats;
  outboundAudio?: AudioStats;
  candidatePairs?: CandidatePair[];
  codecs?: Codec[];
}

interface PeerConnectionConfig {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
}

export function urlify(text: string | null | undefined): (string | React.ReactElement)[] | null {
  if (!text) {
    return null;
  }
  const urlRegex =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
  const parts = text.split(urlRegex);

  for (let i = 1; i < parts.length; i += 2) {
    const hasExternalLink = parts[i].startsWith('https://') || parts[i].startsWith('http://');

    if (!hasExternalLink) {
      const externalizedLink = 'https://' + parts[i];
      // @ts-ignore
      parts[i] = (
        <a href={externalizedLink} key={i} target="_blank" rel="noreferrer">
          {parts[i].length > 60 ? parts[i].slice(0, 55) + '...' : parts[i]}
        </a>
      );
    } else {
      // @ts-ignore
      parts[i] = (
        <a href={parts[i]} key={i} target="_blank" rel="noreferrer">
          {parts[i].length > 60 ? parts[i].slice(0, 55) + '...' : parts[i]}
        </a>
      );
    }
  }
  return parts;
}

export function getRootAttribute(attribute: string): string | null {
  return document.getElementById('root')?.getAttribute(attribute) || null;
}

export function isNull(obj: any): obj is null | undefined {
  return obj === null || typeof obj === 'undefined';
}

export function getLang(): string {
  if (!isNull(navigator.languages)) return navigator.languages[0];
  return navigator.language;
}

export function makeId(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function getUrlParameter(sParam: string, search?: string): string | boolean | undefined {
  if (typeof search === 'undefined' || search == null) {
    search = window.location.search;
  }
  const sPageURL = decodeURIComponent(search.substring(1));
  const sURLVariables = sPageURL.split('&');

  for (let i = 0; i < sURLVariables.length; i++) {
    const sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
  return undefined;
}

export const getHashParam = (param: string): string | null => {
  const match = window.location.hash.match(new RegExp(`[?&]${param}=([^&]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export function updateMetaData(
  metaData: string | null | undefined,
  key: string,
  value: any,
): string {
  let metaDataObj: Record<string, any> = {};
  if (!isNull(metaData)) {
    try {
      metaDataObj = JSON.parse(metaData as string);
    } catch {
      metaDataObj = {};
    }
  }
  metaDataObj[key] = value;
  return JSON.stringify(metaDataObj);
}

export function parseMetaData(metaData: string | null | undefined): Record<string, any> {
  if (isNull(metaData)) return {};
  try {
    return JSON.parse(metaData as string);
  } catch {
    return {};
  }
}

// Falls back to the metadata: the flag is only set on participants we got a join event for.
export function isScreenShareParticipant(participant?: {
  isScreenSharing?: boolean;
  metaData?: string;
}): boolean {
  if (!participant) return false;
  if (participant.isScreenSharing === true) return true;
  return parseMetaData(participant.metaData)[MetaDataKeys.IS_SCREEN_SHARING] === true;
}

export function screenShareOwnerId(participant?: {
  ownerStreamId?: string;
  metaData?: string;
}): string | undefined {
  if (!participant) return undefined;
  return (
    participant.ownerStreamId || parseMetaData(participant.metaData)[MetaDataKeys.OWNER_STREAM_ID]
  );
}

export function getFirstLetter(str: string): string {
  if (typeof str !== 'string' || str.length === 0) return '';
  return str.trim().charAt(0).toUpperCase();
}

// Helper function to get role display names
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Admin';
    case USER_ROLES.PUBLISHER:
      return 'Publisher';
    case USER_ROLES.SUBSCRIBER:
      return 'Subscriber';
    default:
      return role;
  }
};

export function calculateConnectionQualityScore(
  stats: ConnectionStats | null | undefined,
  previousStats: ConnectionStats | null = null,
  timeDelta: number = 0,
): number {
  if (!stats) {
    return 0;
  }

  const metrics: QualityMetrics = {};
  const issues: QualityIssue[] = [];
  let qualityScore = 5.0; // Start with perfect score

  // Helper function to safely get nested properties
  const safeGet = (obj: any, path: string, defaultValue: number = 0): number => {
    return path
      .split('.')
      .reduce(
        (current, key) => (current && current[key] !== undefined ? current[key] : defaultValue),
        obj,
      );
  };

  // 1. Calculate Packet Loss Score (40% weight)
  let packetLossScore = 5.0;
  const videoPacketsReceived = safeGet(stats, 'inboundVideo.packetsReceived');
  const videoPacketsLost = safeGet(stats, 'inboundVideo.packetsLost');
  const audioPacketsReceived = safeGet(stats, 'inboundAudio.packetsReceived');
  const audioPacketsLost = safeGet(stats, 'inboundAudio.packetsLost');

  // For outbound stats
  const outboundVideoPacketsSent = safeGet(stats, 'outboundVideo.packetsSent');
  const outboundVideoPacketsLost = safeGet(stats, 'outboundVideo.packetsLost');
  const outboundAudioPacketsSent = safeGet(stats, 'outboundAudio.packetsSent');
  const outboundAudioPacketsLost = safeGet(stats, 'outboundAudio.packetsLost');

  let totalPacketsReceived = videoPacketsReceived + audioPacketsReceived;
  const totalPacketsLost = videoPacketsLost + audioPacketsLost;
  let totalPacketsSent = outboundVideoPacketsSent + outboundAudioPacketsSent;
  const totalOutboundPacketsLost = outboundVideoPacketsLost + outboundAudioPacketsLost;

  // Use the appropriate stats based on connection type
  if (stats.connectionType === 'subscriber') {
    totalPacketsReceived = Math.max(totalPacketsReceived, 1); // Avoid division by zero
    metrics.packetLossPercent =
      (totalPacketsLost / (totalPacketsReceived + totalPacketsLost)) * 100;
  } else {
    totalPacketsSent = Math.max(totalPacketsSent, 1); // Avoid division by zero
    metrics.packetLossPercent =
      totalPacketsSent > 0 ? (totalOutboundPacketsLost / totalPacketsSent) * 100 : 0;
  }

  if (metrics.packetLossPercent > 0.1) {
    packetLossScore = Math.max(1, 5 - metrics.packetLossPercent * 0.5);
    if (metrics.packetLossPercent > 5) {
      issues.push({
        type: 'network',
        severity: metrics.packetLossPercent > 10 ? 'critical' : 'warning',
        message: `High packet loss: ${metrics.packetLossPercent.toFixed(2)}%`,
      });
    }
  }

  // 2. Calculate RTT Score (25% weight)
  let rttScore = 5.0;
  metrics.rtt = 0;
  if (stats.candidatePairs && stats.candidatePairs.length > 0) {
    metrics.rtt = Math.min(...stats.candidatePairs.map((pair) => pair.rtt || 0));

    if (metrics.rtt > 50) {
      rttScore = Math.max(1, 5 - (metrics.rtt - 50) / 50);
      if (metrics.rtt > 200) {
        issues.push({
          type: 'network',
          severity: metrics.rtt > 400 ? 'critical' : 'warning',
          message: `High latency: ${metrics.rtt.toFixed(0)}ms`,
        });
      }
    }
  }

  // 3. Calculate Jitter Score (15% weight)
  let jitterScore = 5.0;
  const videoJitter = safeGet(stats, 'inboundVideo.jitter');
  const audioJitter = safeGet(stats, 'inboundAudio.jitter');
  metrics.jitter = Math.max(videoJitter, audioJitter);

  if (metrics.jitter > 10) {
    jitterScore = Math.max(1, 5 - (metrics.jitter - 10) / 20);
    if (metrics.jitter > 50) {
      issues.push({
        type: 'network',
        severity: metrics.jitter > 100 ? 'critical' : 'warning',
        message: `High jitter: ${metrics.jitter.toFixed(1)}ms`,
      });
    }
  }

  // 4. Calculate Frame Rate Score (10% weight)
  let frameRateScore = 5.0;
  const framesPerSecond =
    safeGet(stats, 'inboundVideo.framesPerSecond') ||
    safeGet(stats, 'outboundVideo.framesPerSecond');
  metrics.framesPerSecond = framesPerSecond;

  if (framesPerSecond > 0) {
    if (framesPerSecond < 15) {
      frameRateScore = Math.max(1, (framesPerSecond / 15) * 5);
      if (framesPerSecond < 10) {
        issues.push({
          type: 'media',
          severity: framesPerSecond < 5 ? 'critical' : 'warning',
          message: `Low frame rate: ${framesPerSecond.toFixed(1)} fps`,
        });
      }
    }
  }

  // 5. Calculate Frames Dropped Score (5% weight)
  let framesDroppedScore = 5.0;
  const framesReceived = safeGet(stats, 'inboundVideo.framesReceived');
  const framesDropped = safeGet(stats, 'inboundVideo.framesDropped');
  metrics.framesDroppedPercent = 0;

  if (framesReceived > 0) {
    metrics.framesDroppedPercent = (framesDropped / framesReceived) * 100;
    if (metrics.framesDroppedPercent > 1) {
      framesDroppedScore = Math.max(1, 5 - metrics.framesDroppedPercent * 0.2);
      if (metrics.framesDroppedPercent > 5) {
        issues.push({
          type: 'media',
          severity: metrics.framesDroppedPercent > 15 ? 'critical' : 'warning',
          message: `Frames being dropped: ${metrics.framesDroppedPercent.toFixed(1)}%`,
        });
      }
    }
  }

  // 6. Calculate Bitrate Score (5% weight)
  let bitrateScore = 5.0;
  metrics.bitrate = 0;

  if (previousStats && timeDelta > 0) {
    const currentBytes =
      stats.connectionType === 'subscriber'
        ? safeGet(stats, 'inboundVideo.bytesReceived', 0)
        : safeGet(stats, 'outboundVideo.bytesSent', 0);

    const previousBytes =
      stats.connectionType === 'subscriber'
        ? safeGet(previousStats, 'inboundVideo.bytesReceived', 0)
        : safeGet(previousStats, 'outboundVideo.bytesSent', 0);

    const bytesDelta = currentBytes - previousBytes;
    metrics.bitrate = (bytesDelta * 8) / timeDelta; // bits per second

    // Expected minimum bitrates
    const minVideoBitrate = 200000; // 200 kbps
    if (metrics.bitrate < minVideoBitrate && metrics.bitrate > 0) {
      bitrateScore = Math.max(1, (metrics.bitrate / minVideoBitrate) * 5);
      if (metrics.bitrate < 100000) {
        issues.push({
          type: 'network',
          severity: metrics.bitrate < 50000 ? 'critical' : 'warning',
          message: `Low bitrate: ${(metrics.bitrate / 1000).toFixed(0)} kbps`,
        });
      }
    }
  }

  // Calculate weighted final score
  qualityScore =
    packetLossScore * 0.4 + // 40% weight
    rttScore * 0.25 + // 25% weight
    jitterScore * 0.15 + // 15% weight
    frameRateScore * 0.1 + // 10% weight
    framesDroppedScore * 0.05 + // 5% weight
    bitrateScore * 0.05; // 5% weight

  // Additional metrics for a detailed view
  metrics.resolution = stats.inboundVideo
    ? `${stats.inboundVideo.frameWidth}×${stats.inboundVideo.frameHeight}`
    : stats.outboundVideo
      ? `${stats.outboundVideo.frameWidth}×${stats.outboundVideo.frameHeight}`
      : 'Unknown';

  metrics.codec =
    stats.codecs && stats.codecs.length > 0
      ? stats.codecs.find((c) => c.mimeType.includes('video'))?.mimeType || 'Unknown'
      : 'Unknown';

  return Math.max(1, Math.min(5, Number(qualityScore.toFixed(1)))); // score
}

export function truncateText(text: string, maxLength: number = 20): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

export const truncateFileName = (fileName: string, maxLength: number = 15): string => {
  // If filename is already short enough, return as is
  if (fileName.length <= maxLength) {
    return fileName;
  }

  // Find the last dot to separate name and extension
  const lastDotIndex = fileName.lastIndexOf('.');

  // If no extension found, just truncate with ...
  if (lastDotIndex === -1) {
    return fileName.substring(0, maxLength - 3) + '...';
  }

  const name = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex); // includes the dot

  // Calculate how much space we have for the name
  // maxLength - extension.length - 3 (for "...")
  const availableLength = maxLength - extension.length - 3;

  // If extension itself is too long or no space for name, just truncate the whole thing
  if (availableLength <= 1) {
    return fileName.substring(0, maxLength - 3) + '...';
  }

  // Truncate name and add extension
  return name.substring(0, availableLength) + '...' + extension;
};

export function setupPeerConnectionConfig(): void {
  const turnServerURL = getRuntimeConfig().VITE_TURN_SERVER_URL;
  const turnUsername = getRuntimeConfig().VITE_TURN_SERVER_USERNAME;
  const turnCredential = getRuntimeConfig().VITE_TURN_SERVER_CREDENTIAL;

  if (turnServerURL) {
    (peerConfig as PeerConnectionConfig).iceServers.unshift({
      urls: turnServerURL,
      username: turnUsername,
      credential: turnCredential,
    });
  }
}

export function isConfigServiceAvailable(): boolean {
  return !isNull(getRuntimeConfig().VITE_CONFIG_SERVICE_URL);
}
