import React, { createContext, useContext, useState, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import log from 'loglevel';

interface GoogleUser {
  email: string;
  family_name: string;
  given_name: string;
  id: string;
  name: string;
  picture: string;
  verified_email: boolean;
  hd?: string; // Hosted domain
}

interface GoogleAuthContextType {
  user: GoogleUser | null;
  token: string | null;
  setCredential: (credential: string) => void;
  loginAsGuest: () => void;
  logOut: () => void;
  isAuthenticated: boolean;
  isGuest: boolean;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('google_token'));
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Load user from token on mount or when token changes
  React.useEffect(() => {
    const storedToken = localStorage.getItem('google_token');
    if (storedToken) {
      if (storedToken === 'guest') {
        setToken(storedToken);
        setIsGuest(true);
        setUser({
          email: 'guest@red5.net',
          family_name: 'Guest',
          given_name: 'User',
          id: 'guest',
          name: 'Guest User',
          picture: '',
          verified_email: true,
        });
        log.info('Restored Guest session');
      } else {
        try {
          const decoded = jwtDecode<GoogleUser & { exp: number }>(storedToken);
          // Check expiration
          if (decoded.exp * 1000 < Date.now()) {
            log.warn('Token expired');
            logOut();
          } else {
            setToken(storedToken);
            setUser(decoded);
            setIsGuest(false);
            log.info('Restored Google User session:', decoded);
          }
        } catch (error) {
          log.error('Failed to decode stored token', error);
          logOut();
        }
      }
    }
  }, []);

  const setCredential = (credential: string) => {
    setToken(credential);
    localStorage.setItem('google_token', credential);
    try {
      const decoded = jwtDecode<GoogleUser>(credential);
      setUser(decoded);
      setIsGuest(false);
      log.info('Google User logged in:', decoded);
    } catch (error) {
      log.error('Failed to decode credential', error);
    }
  };

  const loginAsGuest = () => {
    const guestToken = 'guest';
    setToken(guestToken);
    localStorage.setItem('google_token', guestToken);
    setIsGuest(true);
    setUser({
      email: 'guest@red5.net',
      family_name: 'Guest',
      given_name: 'User',
      id: 'guest',
      name: 'Guest User',
      picture: '',
      verified_email: true,
    });
    log.info('Logged in as Guest');
  };

  const logOut = () => {
    googleLogout();
    setUser(null);
    setToken(null);
    setIsGuest(false);
    localStorage.removeItem('google_token');
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        token,
        setCredential,
        loginAsGuest,
        logOut,
        isAuthenticated: !!token,
        isGuest,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};
