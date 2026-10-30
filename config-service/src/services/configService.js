import fs from 'fs/promises';
import path from 'path';
import { resolveTheme } from '../utils/validation.js';

const CONFIG_FILE = process.env.CONFIG_FILE || '/data/config.json';

const MASK = '***';

const SENSITIVE_FIELDS = [
  'VITE_PUBNUB_PUBLISH_KEY',
  'VITE_PUBNUB_SUBSCRIBE_KEY',
  'VITE_AWS_ACCESS_KEY',
  'VITE_AWS_SECRET_ACCESS_KEY',
];

class ConfigService {
  async initialize() {
    try {
      await fs.access(CONFIG_FILE);
      console.log('Config file already exists');
    } catch {
      console.log('Creating initial config file from environment variables...');
      const defaultConfig = {
        VITE_HOST: process.env.VITE_HOST || '',
        VITE_BACKEND_HOST: process.env.VITE_BACKEND_HOST || '',
        VITE_ENABLE_RECORDING: process.env.VITE_ENABLE_RECORDING || 'false',
        VITE_ENABLE_CLOSED_CAPTION: process.env.VITE_ENABLE_CLOSED_CAPTION || 'false',
        VITE_ENABLE_EXTERNAL_STREAMS: process.env.VITE_ENABLE_EXTERNAL_STREAMS || 'false',
        VITE_DEFAULT_THEME: resolveTheme(process.env.VITE_DEFAULT_THEME),
        VITE_TURN_SERVER_URL: process.env.VITE_TURN_SERVER_URL || 'stun:stun2.l.google.com:19302',
        VITE_TURN_SERVER_USERNAME: process.env.VITE_TURN_SERVER_USERNAME || '',
        VITE_TURN_SERVER_CREDENTIAL: process.env.VITE_TURN_SERVER_CREDENTIAL || '',
        VITE_NODE_GROUP: process.env.VITE_NODE_GROUP || 'default',
        VITE_LOGO_URL: process.env.VITE_LOGO_URL || '',
        VITE_BASENAME: process.env.VITE_BASENAME || '/meetings',
        VITE_ANALYTICS_ENDPOINT: process.env.VITE_ANALYTICS_ENDPOINT,
        VITE_VIRTUAL_BACKGROUND_IMAGES: process.env.VITE_VIRTUAL_BACKGROUND_IMAGES || '',
        VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || '',
        VITE_ENABLE_GOOGLE_AUTH: process.env.VITE_ENABLE_GOOGLE_AUTH || 'false',
        VITE_PUBNUB_PUBLISH_KEY: process.env.VITE_PUBNUB_PUBLISH_KEY || '',
        VITE_PUBNUB_SUBSCRIBE_KEY: process.env.VITE_PUBNUB_SUBSCRIBE_KEY || '',
        VITE_AWS_ACCESS_KEY: process.env.VITE_AWS_ACCESS_KEY || '',
        VITE_AWS_SECRET_ACCESS_KEY: process.env.VITE_AWS_SECRET_ACCESS_KEY || '',
        VITE_AWS_BUCKET_NAME: process.env.VITE_AWS_BUCKET_NAME || '',
        VITE_AWS_BUCKET_LOCATION: process.env.VITE_AWS_BUCKET_LOCATION || '',
      };

      await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
      await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      console.log('Config file created successfully');
    }
  }

  async read() {
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      return { ...config, VITE_DEFAULT_THEME: resolveTheme(config.VITE_DEFAULT_THEME) };
    } catch (error) {
      console.error('Error reading config:', error);
      throw new Error('Failed to read configuration', { cause: error });
    }
  }

  async update(updates) {
    let currentConfig = {};
    try {
      currentConfig = await this.read();
    } catch {
      console.log('No existing config found, creating new one during update');
    }

    const updatedConfig = {
      ...currentConfig,
      ...this.restoreMaskedFields(updates, currentConfig),
    };

    await fs.writeFile(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    return updatedConfig;
  }

  async replace(newConfig) {
    let currentConfig = {};
    try {
      currentConfig = await this.read();
    } catch {
      console.log('No existing config found, nothing to carry over during replace');
    }

    const replacement = this.restoreMaskedFields(newConfig, currentConfig);
    await fs.writeFile(CONFIG_FILE, JSON.stringify(replacement, null, 2));
    return replacement;
  }

  // Clients only ever see the mask, so sending it back means "keep the stored value". Without this,
  // a client saving what it read would overwrite the real secret with the mask.
  restoreMaskedFields(incoming, currentConfig) {
    const restored = { ...incoming };
    for (const field of SENSITIVE_FIELDS) {
      if (restored[field] === MASK) {
        if (currentConfig[field] === undefined) {
          delete restored[field];
        } else {
          restored[field] = currentConfig[field];
        }
      }
    }
    return restored;
  }

  maskSensitiveFields(config) {
    const masked = { ...config };
    for (const field of SENSITIVE_FIELDS) {
      if (masked[field]) {
        masked[field] = MASK;
      }
    }
    return masked;
  }

  getConfigFilePath() {
    return CONFIG_FILE;
  }
}

export default new ConfigService();
