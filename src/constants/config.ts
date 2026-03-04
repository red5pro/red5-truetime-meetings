export const sharedVariables = {
  scrollThreshold: -Infinity,
  scroll_down: true,
  fullScreenId: -1,
  desiredTileCount: 30,
  maxRetries: 5,
  retryInterval: 5000,
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
