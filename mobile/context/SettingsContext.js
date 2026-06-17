import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const setThemeTo = (t) => setTheme(t);

  return (
    <SettingsContext.Provider value={{ theme, setThemeTo }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export const THEME_LIST = [
  { id: 'dark',   label: 'Dark',         icon: '🌙', desc: 'Classic dark mode' },
  { id: 'light',  label: 'Light',        icon: '☀️', desc: 'Clean and bright' },
  { id: 'alien',  label: 'Alien',        icon: '👽', desc: 'Neon green otherworldly' },
  { id: 'pilot',  label: 'Drone Pilot',  icon: '🎖', desc: 'Military HUD amber' },
];

export const THEMES = {
  dark: {
    bg:          '#000000',
    bgSecondary: '#0a0a0a',
    bgGradient:  ['#050505', '#0a0a14', '#050505'],
    surface:     'rgba(255,255,255,0.05)',
    glass:       'rgba(255,255,255,0.08)',
    glassBorder: 'rgba(255,255,255,0.12)',
    text:        '#ffffff',
    textMuted:   '#666666',
    textSub:     '#333333',
    border:      'rgba(255,255,255,0.1)',
    pill:        '#111111',
    pillBorder:  '#2a2a2a',
    accent:      '#0ea5e9',
    accentGlow:  '#0ea5e930',
    statusBar:   'light',
  },
  light: {
    bg:          '#f0f4f8',
    bgSecondary: '#e2e8f0',
    bgGradient:  ['#dbeafe', '#f0f9ff', '#dbeafe'],
    surface:     'rgba(0,0,0,0.04)',
    glass:       'rgba(255,255,255,0.75)',
    glassBorder: 'rgba(255,255,255,0.95)',
    text:        '#0f172a',
    textMuted:   '#64748b',
    textSub:     '#94a3b8',
    border:      'rgba(0,0,0,0.08)',
    pill:        'rgba(255,255,255,0.85)',
    pillBorder:  'rgba(0,0,0,0.12)',
    accent:      '#0ea5e9',
    accentGlow:  '#0ea5e920',
    statusBar:   'dark',
  },
  alien: {
    bg:          '#000a00',
    bgSecondary: '#001a00',
    bgGradient:  ['#000a00', '#001400', '#000a00'],
    surface:     'rgba(57,255,20,0.05)',
    glass:       'rgba(57,255,20,0.08)',
    glassBorder: 'rgba(57,255,20,0.25)',
    text:        '#39ff14',
    textMuted:   '#1a8c00',
    textSub:     '#0d5200',
    border:      'rgba(57,255,20,0.15)',
    pill:        'rgba(57,255,20,0.06)',
    pillBorder:  'rgba(57,255,20,0.2)',
    accent:      '#39ff14',
    accentGlow:  '#39ff1430',
    statusBar:   'light',
  },
  pilot: {
    bg:          '#0a0800',
    bgSecondary: '#150f00',
    bgGradient:  ['#0a0800', '#1a1000', '#0a0800'],
    surface:     'rgba(251,191,36,0.05)',
    glass:       'rgba(251,191,36,0.08)',
    glassBorder: 'rgba(251,191,36,0.25)',
    text:        '#fbbf24',
    textMuted:   '#92600a',
    textSub:     '#5c3c04',
    border:      'rgba(251,191,36,0.15)',
    pill:        'rgba(251,191,36,0.06)',
    pillBorder:  'rgba(251,191,36,0.2)',
    accent:      '#fbbf24',
    accentGlow:  '#fbbf2430',
    statusBar:   'light',
  },
};
