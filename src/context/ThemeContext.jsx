'use client';
// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeCtx = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
});

const KEY = 'kracradio:theme';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  // défaut: dark (comme souhaité). Si tu préfères suivre le système:
  // return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Applique la classe `dark` sur <html> pour Tailwind (darkMode: 'class')
  useEffect(() => {
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
