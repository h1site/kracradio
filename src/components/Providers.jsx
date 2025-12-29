'use client';

import { ThemeProvider } from '../context/ThemeContext';
import { UIProvider } from '../context/UIContext';
import { I18nProvider } from '../i18n';
import { AudioPlayerProvider } from '../context/AudioPlayerContext';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { LikedSongsProvider } from '../context/LikedSongsContext';
import { PlaylistProvider } from '../context/PlaylistContext';
import { NowPlayingProvider } from '../context/NowPlayingContext';
import { CartProvider } from '../context/CartContext';
import CartDrawer from '../components/store/CartDrawer';

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
                    <NowPlayingProvider>
                      <CartProvider>
                        {children}
                        <CartDrawer />
                      </CartProvider>
                    </NowPlayingProvider>
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
