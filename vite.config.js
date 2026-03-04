import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';

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
