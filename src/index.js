// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import ErrorBoundary from './ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';   // <<<<<< ICI
import { I18nProvider } from './i18n';
import { AudioPlayerProvider } from './context/AudioPlayerContext';

import App from './routes/App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <ErrorBoundary>
      <ThemeProvider>
        <UIProvider> {/* <<<<<< ICI */}
          <I18nProvider>
            <AudioPlayerProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AudioPlayerProvider>
          </I18nProvider>
        </UIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </HelmetProvider>
);
