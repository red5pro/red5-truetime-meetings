export const sharedVariables = {
  scrollThreshold: -Infinity,
  scroll_down: true,
  fullScreenId: -1,
  desiredTileCount: 30,
  maxRetries: 5,
  retryInterval: 5000,
  /** Internal health poll interval (ms) when SDK events may not fire */
  healthCheckInterval: 3000,
  /** Max wait for publish after join before fatal error (ms) */
  publishTimeoutMs: 30000,
  /** Grace period after reconnect before treating publish as failed (ms) */
  publishRecoveryGraceMs: 8000,
  /** How long a subscribe may stay pending before health monitor retries (ms) */
  subscribeStaleMs: 10000,
};

export const peerConfig = {
  iceServers: [
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
  ],
  sdpSemantics: 'unified-plan',
};

export const reactions = {
  sparkling_heart: '💖',
  thumbs_up: '👍🏼',
  party_popper: '🎉',
  clapping_hands: '👏🏼',
  face_with_tears_of_joy: '😂',
  open_mouth: '😮',
  sad_face: '😢',
  thinking_face: '🤔',
  thumbs_down: '👎🏼',
};
