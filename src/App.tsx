import { createContext, JSX, useEffect, useState } from 'react';
import './App.css';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './styles/theme';
import { SnackbarProvider } from 'notistack';
import Red5SnackBar from './Components/Red5SnackBar';
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import CustomRoutes from './CustomRoutes';
import { ThemeList } from './constants/themeList';
import { AvailableLanguages } from './constants/AvailableLanguages';
import log from 'loglevel';
import { getRuntimeConfig } from './utils/configStore';

// Extend the global Window interface to include our custom functions
declare global {
  interface Window {
    getWindowLocation: () => void;
    copyWindowLocation: () => void;
  }
}

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: AvailableLanguages,
  })
  .then((r) => log.log('i18n is initialized', r));

// Language setup
const availableLanguagesList = Object.keys(AvailableLanguages);
let preferredLanguage: string | null = localStorage.getItem('i18nextLng');
if (!preferredLanguage) {
  preferredLanguage = window.navigator.language.slice(0, 2);
}
if (availableLanguagesList.includes(preferredLanguage)) {
  localStorage.setItem('i18nextLng', preferredLanguage);
} else {
  // Falling back to english.
  localStorage.setItem('i18nextLng', 'en');
  preferredLanguage = 'en';
}

i18n
  .changeLanguage(preferredLanguage)
  .then((r) => log.log('Language is set to', preferredLanguage, r));

// Global functions
function getWindowLocation(): void {
  const locationElement = document.getElementById('locationHref') as HTMLInputElement;
  if (locationElement) {
    locationElement.value = window.location.href;
  }
}

function copyWindowLocation(): void {
  const copyText = document.getElementById('locationHref') as HTMLInputElement;

  if (copyText) {
    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand('copy');
  }
}

// Attach functions to window
window.getWindowLocation = getWindowLocation;
window.copyWindowLocation = copyWindowLocation;

// Theme context type
interface ThemeContextType {
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

function App(): JSX.Element {
  const [currentTheme, setCurrentTheme] = useState<string>(
    getRuntimeConfig().VITE_DEFAULT_THEME || ThemeList.Black,
  );

  useEffect(() => {
    // Validate environment variables on app startup
    log.info('Checking environment variables...');

    if (!getRuntimeConfig().VITE_BACKEND_HOST) {
      log.warn('VITE_BACKEND_HOST is not set. Using empty tokens for authentication.');
    } else {
      log.info('Backend host configured:', getRuntimeConfig().VITE_BACKEND_HOST);
    }

    if (getRuntimeConfig().VITE_ENABLE_CLOSED_CAPTION !== 'true') {
      log.warn(
        'Closed captions feature is disabled. Set VITE_ENABLE_CLOSED_CAPTION=true to enable.',
      );
    } else {
      log.info('Closed captions feature is enabled');
    }

    if (getRuntimeConfig().VITE_ENABLE_RECORDING !== 'true') {
      log.warn('Recording feature is disabled. Set VITE_ENABLE_RECORDING=true to enable.');
    } else {
      log.info('Recording feature is enabled');
    }

    log.info('App initialization complete');
  }, []);

  useEffect(() => {
    const handleFullScreen = (e: Event): void => {
      const target = e.target as HTMLElement;
      if (target?.id === 'stream-gallery') {
        if (!document.fullscreenElement) {
          document.documentElement
            .requestFullscreen()
            .then((r) => log.log('Fullscreen is requested', r));
        } else {
          document.exitFullscreen().then((r) => log.log('Fullscreen is exited', r));
        }
      }
    };

    window.addEventListener('dblclick', handleFullScreen);

    // cleanup this component
    return () => {
      window.removeEventListener('dblclick', handleFullScreen);
    };
  }, []);

  return (
    <ThemeProvider theme={theme(currentTheme)}>
      <CssBaseline />
      <SnackbarProvider
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        maxSnack={3}
        Components={{
          info: Red5SnackBar,
          // @ts-ignore
          message: Red5SnackBar,
        }}
      >
        <ThemeContext.Provider
          value={{
            currentTheme,
            setCurrentTheme,
          }}
        >
          <CustomRoutes />
        </ThemeContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
