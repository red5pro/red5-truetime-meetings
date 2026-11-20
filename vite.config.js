import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Every VITE_* value ends up in the JavaScript bundle, readable by anyone who opens the app. The S3
// keys belong on the config service, which uploads recordings for the browser.
const SERVER_ONLY_SECRETS = ['VITE_AWS_ACCESS_KEY', 'VITE_AWS_SECRET_ACCESS_KEY'];

function checkForServerSecrets(mode, command) {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const found = SERVER_ONLY_SECRETS.filter((key) => env[key]);
  if (found.length === 0) return;
  const message =
    `${found.join(' and ')} would be built into the app, where every visitor can read them. ` +
    'Remove them from the app environment (.env) and set them on the config service instead; ' +
    'see docs/configuration.md.';
  if (command === 'build') throw new Error(message);
  console.warn(`\nWarning: ${message}\n`);
}

export default defineConfig(({ mode, command }) => {
  const isProduction = mode === 'production';
  if (mode !== 'test') checkForServerSecrets(mode, command);

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
