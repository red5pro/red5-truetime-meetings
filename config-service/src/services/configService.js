import { resolveTheme } from '../utils/validation.js';
import { createFileStore, readConfigFile } from './stores/fileStore.js';
import { createMysqlStore, mysqlSettings } from './stores/mysqlStore.js';

const CONFIG_FILE = process.env.CONFIG_FILE || '/data/config.json';

const MASK = '***';

const SENSITIVE_FIELDS = [
  'VITE_PUBNUB_PUBLISH_KEY',
  'VITE_PUBNUB_SUBSCRIBE_KEY',
  'VITE_AWS_ACCESS_KEY',
  'VITE_AWS_SECRET_ACCESS_KEY',
];

function envDefaults() {
  return {
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
}

/**
 * Where the config is kept: MySQL when MEETINGS_DB_HOST and MEETINGS_DB_USER are set (in its own
 * schema, so it can live on Studio's database server), otherwise the JSON file at CONFIG_FILE.
 */
export function createStore() {
  const settings = mysqlSettings();
  return settings ? createMysqlStore(settings) : createFileStore(CONFIG_FILE);
}

class ConfigService {
  constructor() {
    this.store = null;
  }

  getStore() {
    this.store ??= createStore();
    return this.store;
  }

  async initialize() {
    const store = this.getStore();
    console.log(`Config storage: ${store.describe()}`);
    await store.init(async () => {
      // Moving to the database: carry over what the file had, so no settings are lost
      if (store.kind !== 'file') {
        const existing = await readConfigFile(CONFIG_FILE);
        if (existing) {
          console.log(`Importing the existing config from ${CONFIG_FILE}`);
          return existing;
        }
      }
      return envDefaults();
    });
  }

  async read() {
    try {
      const config = await this.getStore().load();
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

    await this.getStore().save(updatedConfig);
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
    await this.getStore().save(replacement);
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

  /** Where the config is kept, for the startup log. */
  describeStorage() {
    return this.getStore().describe();
  }

  /** Closes the database connections, if any. */
  async close() {
    await this.store?.close();
  }
}

export default new ConfigService();
