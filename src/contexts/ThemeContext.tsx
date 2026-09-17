import { createContext } from 'react';

export interface ThemeContextType {
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
