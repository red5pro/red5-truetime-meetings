export const ALLOWED_KEYS = new Set([
  'VITE_HOST',
  'VITE_BACKEND_HOST',
  'VITE_ENABLE_RECORDING',
  'VITE_ENABLE_CLOSED_CAPTION',
  'VITE_DEFAULT_THEME',
  'VITE_TURN_SERVER_URL',
  'VITE_TURN_SERVER_USERNAME',
  'VITE_TURN_SERVER_CREDENTIAL',
  'VITE_NODE_GROUP',
  'VITE_LOGO_URL',
  'VITE_BASENAME',
  'VITE_ENABLE_EXTERNAL_STREAMS',
  'VITE_VIRTUAL_BACKGROUND_IMAGES',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_ENABLE_GOOGLE_AUTH',
  'VITE_PUBNUB_PUBLISH_KEY',
  'VITE_PUBNUB_SUBSCRIBE_KEY',
  'VITE_AWS_ACCESS_KEY',
  'VITE_AWS_SECRET_ACCESS_KEY',
  'VITE_AWS_BUCKET_NAME',
  'VITE_AWS_BUCKET_LOCATION',
]);

// The palette names in truetime-ui (src/tokens/palettes.ts). The app silently falls back to black
// for any other name, so a theme added there has to be added here before it can be saved.
export const validThemes = [
  'black',
  'blue',
  'purple',
  'emerald',
  'aurora',
  'sunset',
  'ocean',
  'broadcast',
];
export const validBooleans = ['true', 'false'];

export const DEFAULT_THEME = 'black';

// For values that arrive without validation: the environment and a stored config file. The compose
// files pass `default` when VITE_DEFAULT_THEME is unset, and older deployments have saved it.
export const resolveTheme = (theme) => (validThemes.includes(theme) ? theme : DEFAULT_THEME);

// API requests may ask for `default` by name. Any other unknown theme is left for validateConfig to
// reject, so a typo is reported rather than silently saved as black.
export const applyDefaultTheme = (config) => {
  if (config.VITE_DEFAULT_THEME === 'default') {
    config.VITE_DEFAULT_THEME = DEFAULT_THEME;
  }
};

export const validateConfig = (config) => {
  const errors = [];

  // Reject unknown keys
  for (const key of Object.keys(config)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors.push(`Unknown config key: ${key}`);
    }
  }

  // Validate URLs
  if (config.VITE_TURN_SERVER_URL !== undefined && config.VITE_TURN_SERVER_URL !== '') {
    if (!config.VITE_TURN_SERVER_URL.match(/^(turn:|turns:|stun:)/)) {
      errors.push('VITE_TURN_SERVER_URL must start with turn:, turns: or stun:');
    }
  }

  // Validate boolean fields
  if (
    config.VITE_ENABLE_RECORDING !== undefined &&
    !validBooleans.includes(config.VITE_ENABLE_RECORDING)
  ) {
    errors.push('VITE_ENABLE_RECORDING must be "true" or "false"');
  }

  if (
    config.VITE_ENABLE_CLOSED_CAPTION !== undefined &&
    !validBooleans.includes(config.VITE_ENABLE_CLOSED_CAPTION)
  ) {
    errors.push('VITE_ENABLE_CLOSED_CAPTION must be "true" or "false"');
  }

  if (
    config.VITE_ENABLE_EXTERNAL_STREAMS !== undefined &&
    !validBooleans.includes(config.VITE_ENABLE_EXTERNAL_STREAMS)
  ) {
    errors.push('VITE_ENABLE_EXTERNAL_STREAMS must be "true" or "false"');
  }

  // Validate theme
  if (config.VITE_DEFAULT_THEME !== undefined && !validThemes.includes(config.VITE_DEFAULT_THEME)) {
    errors.push(`VITE_DEFAULT_THEME must be one of: ${validThemes.join(', ')}`);
  }

  return errors;
};
