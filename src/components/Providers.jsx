'use client';

import { ThemeProvider } from '../context/ThemeContext';
import { UIProvider } from '../context/UIContext';
import { I18nProvider } from '../i18n';
import { AudioPlayerProvider } from '../context/AudioPlayerContext';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { LikedSongsProvider } from '../context/LikedSongsContext';
import { PlaylistProvider } from '../context/PlaylistContext';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <UIProvider>
        <I18nProvider>
          <AuthProvider>
            <AudioPlayerProvider>
              <NotificationProvider>
                <LikedSongsProvider>
                  <PlaylistProvider>
                    {children}
                  </PlaylistProvider>
                </LikedSongsProvider>
              </NotificationProvider>
            </AudioPlayerProvider>
          </AuthProvider>
        </I18nProvider>
      </UIProvider>
    </ThemeProvider>
  );
}
