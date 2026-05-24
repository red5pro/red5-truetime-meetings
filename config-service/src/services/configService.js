import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE = process.env.CONFIG_FILE || '/data/config.json';

const SENSITIVE_FIELDS = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_PUBNUB_PUBLISH_KEY',
  'VITE_PUBNUB_SUBSCRIBE_KEY',
  'VITE_AWS_ACCESS_KEY',
  'VITE_AWS_SECRET_ACCESS_KEY',
  'VITE_AWS_BUCKET_NAME',
  'VITE_AWS_BUCKET_LOCATION',
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
        VITE_DEFAULT_THEME: process.env.VITE_DEFAULT_THEME || 'black',
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
      return JSON.parse(data);
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
      ...updates,
    };

    await fs.writeFile(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    return updatedConfig;
  }

  async replace(newConfig) {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return newConfig;
  }

  maskSensitiveFields(config) {
    const masked = { ...config };
    for (const field of SENSITIVE_FIELDS) {
      if (masked[field]) {
        masked[field] = '***';
      }
    }
    return masked;
  }

  getConfigFilePath() {
    return CONFIG_FILE;
  }
}

export default new ConfigService();
