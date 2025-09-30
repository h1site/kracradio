// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import ErrorBoundary from './ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { I18nProvider } from './i18n';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AuthProvider } from './context/AuthContext'; // <-- NEW

import App from './routes/App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter> {/* place-le ici pour éviter tout double Router */}
      <ErrorBoundary>
        <ThemeProvider>
          <UIProvider>
            <I18nProvider>
              <AuthProvider> {/* <-- NEW : auth Supabase */}
                <AudioPlayerProvider>
                  <App />
                </AudioPlayerProvider>
              </AuthProvider>
            </I18nProvider>
          </UIProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </HelmetProvider>
);
