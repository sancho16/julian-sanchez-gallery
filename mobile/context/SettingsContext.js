import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

// Theme tokens
export const THEMES = {
  dark: {
    bg:          '#000000',
    bgSecondary: '#0a0a0a',
    surface:     'rgba(255,255,255,0.05)',
    glass:       'rgba(255,255,255,0.08)',
    glassBorder: 'rgba(255,255,255,0.12)',
    text:        '#ffffff',
    textMuted:   '#666666',
    textSub:     '#444444',
    border:      'rgba(255,255,255,0.1)',
    pill:        '#111111',
    pillBorder:  '#2a2a2a',
  },
  light: {
    bg:          '#f0f4f8',
    bgSecondary: '#e2e8f0',
    surface:     'rgba(0,0,0,0.04)',
    glass:       'rgba(255,255,255,0.7)',
    glassBorder: 'rgba(255,255,255,0.9)',
    text:        '#0f172a',
    textMuted:   '#64748b',
    textSub:     '#94a3b8',
    border:      'rgba(0,0,0,0.08)',
    pill:        'rgba(255,255,255,0.8)',
    pillBorder:  'rgba(0,0,0,0.12)',
  },
};
