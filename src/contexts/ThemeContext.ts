import { createContext } from 'react';

// Theme context type
export interface ThemeContextType {
    currentTheme: string;
    setCurrentTheme: (theme: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
