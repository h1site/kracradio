// src/components/ThemeSwitch.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitch({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 text-white transition ${className}`}
      aria-label={isDark ? 'Passer en thème clair' : 'Passer en thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
    >
      {isDark ? (
        // Icône Soleil (pour passer au clair)
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
          <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zm10.48 0l1.8-1.79 1.79 1.79-1.79 1.8-1.8-1.8zM12 4V1h-0v3h0zm0 19v-3h0v3h0zM4 12H1v0h3v0zm19 0h-3v0h3v0zM6.76 19.16l-1.8 1.79-1.79-1.79 1.79-1.8 1.8 1.8zm12.28 0l1.79 1.79 1.8-1.79-1.8-1.8-1.79 1.8zM12 7a5 5 0 100 10 5 5 0 000-10z"/>
        </svg>
      ) : (
        // Icône Lune (pour passer au sombre)
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
          <path d="M20.742 13.045a8.002 8.002 0 01-9.787-9.787A9 9 0 1020.742 13.045z"/>
        </svg>
      )}
    </button>
  );
}
