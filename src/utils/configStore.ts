export interface RuntimeConfig {
  VITE_TURN_SERVER_URL?: string;
  VITE_TURN_SERVER_USERNAME?: string;
  VITE_TURN_SERVER_CREDENTIAL?: string;
  VITE_HOST?: string;
  VITE_NODE_GROUP?: string;
  VITE_BACKEND_HOST?: string;
  VITE_USE_LOCAL_API_PROXY?: string;
  VITE_ENABLE_CLOSED_CAPTION?: string;
  VITE_ENABLE_RECORDING?: string;
  VITE_ENABLE_EXTERNAL_STREAMS?: string;
  VITE_DEFAULT_THEME?: string;
  VITE_LOGO_URL?: string;
  VITE_BASENAME?: string;
  VITE_VIRTUAL_BACKGROUND_IMAGES?: string;
  VITE_CONFIG_SERVICE_URL?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
  VITE_ENABLE_GOOGLE_AUTH?: string;
  VITE_ANALYTICS_ENDPOINT?: string;
  VITE_AWS_ACCESS_KEY?: string;
  VITE_AWS_SECRET_ACCESS_KEY?: string;
  VITE_AWS_BUCKET_NAME?: string;
  VITE_AWS_BUCKET_LOCATION?: string;
  [key: string]: string | undefined;
}

let runtimeConfig: RuntimeConfig = {};

export const setRuntimeConfig = (config: RuntimeConfig) => {
  runtimeConfig = { ...runtimeConfig, ...config };
};

export const getRuntimeConfig = (): RuntimeConfig => {
  return {
    ...import.meta.env, // Fallback to build-time env vars
    ...runtimeConfig, // Override with runtime config
  };
};

export const getAnalyticsEndpoint = (): string | null | undefined => {
  const { VITE_ANALYTICS_ENDPOINT } = getRuntimeConfig();
  if (VITE_ANALYTICS_ENDPOINT === 'null') {
    return null;
  } else if (VITE_ANALYTICS_ENDPOINT === 'undefined') {
    return undefined;
  }
  return VITE_ANALYTICS_ENDPOINT;
};
