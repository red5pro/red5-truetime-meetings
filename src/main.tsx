import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/GoogleAuthContext';
import './index.css';
import App from './App.js';
import { setRuntimeConfig, getRuntimeConfig } from './utils/configStore';
import { isConfigServiceAvailable } from './utils/utils';

const loadConfig = async () => {
  if (!isConfigServiceAvailable()) {
    return;
  }
  try {
    const response = await fetch(import.meta.env.VITE_CONFIG_SERVICE_URL + '/api/config');
    const config = await response.json();
    setRuntimeConfig(config);
    console.log('Runtime configuration loaded:', config);
  } catch (error) {
    console.error('Failed to load runtime configuration:', error);
    // Fallback to build-time env vars if config service is unavailable
  }
};

loadConfig().then(() => {
  // @ts-expect-error: temporary fix for legacy code
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={getRuntimeConfig().VITE_GOOGLE_CLIENT_ID || ''}>
        <AuthProvider>
          <BrowserRouter basename={getRuntimeConfig().VITE_BASENAME || '/meetings'}>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </StrictMode>,
  );
});
