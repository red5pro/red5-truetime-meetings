import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const env = loadEnv(mode, process.cwd(), '');

  // Opt-in local proxy for the Red5 Pro REST API (/as/v1/...). The app can
  // call VITE_HOST's API directly with an absolute URL (see
  // src/utils/conferenceConfig.ts), but that Red5 Pro server's CORS
  // allow-list may not include http://localhost:*. Setting
  // VITE_USE_LOCAL_API_PROXY=true makes the app call /as/v1 relative to
  // the current origin instead, and this proxy forwards it to VITE_HOST
  // server-side, where CORS doesn't apply.
  const apiProxy =
    env.VITE_USE_LOCAL_API_PROXY === 'true' && env.VITE_HOST
      ? {
          '/as/v1': {
            target: `https://${env.VITE_HOST}`,
            changeOrigin: true,
            secure: true,
          },
        }
      : undefined;

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            [
              'babel-plugin-react-compiler',
              {
                compilationMode: 'annotation', // or 'all'
                panicThreshold: 'all_errors', // or 'critical_errors' or 'none'
              },
            ],
          ],
        },
      }),
    ],
    server: {
      port: 3000,
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
    optimizeDeps: {
      include: ['@aws-sdk/client-s3', '@aws-sdk/lib-storage'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'mui-vendor': ['@mui/material', '@mui/system'],
            'mui-icons': ['@mui/icons-material'],
            'router-vendor': ['react-router-dom'],
            'i18n-vendor': ['react-i18next', 'i18next'],
            pubnub: ['pubnub'],
            'red5pro-webrtc-sdk': ['red5pro-webrtc-sdk'],
            utils: ['loglevel'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: !isProduction,
    },
  };
});
