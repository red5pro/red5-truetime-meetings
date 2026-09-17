import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    resolve: {
      alias: [
        {
          find: /^@mediapipe\/selfie_segmentation$/,
          replacement: fileURLToPath(
            new URL('./src/shims/mediapipe-selfie-segmentation.js', import.meta.url),
          ),
        },
      ],
    },
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
      exclude: ['@mediapipe/selfie_segmentation'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const vendorChunks = {
              'react-vendor': ['react', 'react-dom'],
              'mui-vendor': ['@mui/material', '@mui/system'],
              'mui-icons': ['@mui/icons-material'],
              'router-vendor': ['react-router-dom'],
              'i18n-vendor': ['react-i18next', 'i18next'],
              pubnub: ['pubnub'],
              'red5pro-webrtc-sdk': ['red5pro-webrtc-sdk'],
              utils: ['loglevel'],
            };

            for (const [chunkName, packages] of Object.entries(vendorChunks)) {
              if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
                return chunkName;
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: !isProduction,
    },
  };
});
