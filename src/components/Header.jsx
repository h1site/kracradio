// src/components/Header.jsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useCommunity';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useUI } from '../context/UIContext';
import MobileMenu from './MobileMenu';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { isDark, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { unreadCount } = useUnreadMessages();
  const { isDesktop, sidebarOpen, openSidebar } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Lien du profil artiste: si slug configuré → profil public, sinon → settings pour le créer
  const artistProfileLink = profile?.artist_slug ? `/profile/${profile.artist_slug}` : '/settings';

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a] text-white border-b border-white/5 shadow-lg"
      >
        {/* Desktop (≥1024px) */}
        <div className="hidden lg:flex w-full h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <motion.img
                src="/logo-white.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              />
            </Link>
            {/* Menu button with chevron - only show when sidebar is closed */}
            {isDesktop && !sidebarOpen && (
              <button
                type="button"
                onClick={openSidebar}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                style={{ marginTop: '8px' }}
                aria-label="Ouvrir le menu"
                title="Ouvrir le menu"
              >
                <span className="font-medium">Menu</span>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M8.59 16.59L10 18l6-6l-6-6l-1.41 1.41L13.17 12z" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Notre Boutique */}
            <a
              href="https://store.kracradio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20"
              title={t?.site?.store ?? 'Boutique'}
            >
              <span className="hidden xl:inline">{t?.site?.store ?? 'Boutique'}</span>
              <span className="xl:hidden">🛒</span>
            </a>
            {/* Donation */}
            <Link
              href="/donation"
              className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20"
              title={t?.site?.donation ?? 'Donation'}
            >
              <span className="hidden xl:inline">{t?.site?.donation ?? 'Donation'}</span>
              <span className="xl:hidden">❤️</span>
            </Link>
            {/* KEMP3.app */}
            <a
              href="https://kemp3.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20"
              title="KEMP3"
            >
              KEMP3
            </a>
            {/* Android APP - hidden on smaller screens, icon only on medium */}
            <a
              href="/kracradio.apk"
              download
              className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20 flex items-center gap-1"
              title={lang === 'fr' ? 'Télécharger l\'application Android' : lang === 'es' ? 'Descargar aplicación Android' : 'Download Android App'}
            >
              📱<span className="hidden xl:inline">Android</span>
            </a>

            {/* Submit Music - visible pour tous */}
            <Link
              href="/submit-music"
              className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20 flex items-center gap-1"
              title={lang === 'fr' ? 'Soumission Musique' : lang === 'es' ? 'Enviar Música' : 'Submit Music'}
            >
              🎵<span className="hidden xl:inline">{lang === 'fr' ? 'Soumettre' : lang === 'es' ? 'Enviar' : 'Submit'}</span>
            </Link>

            {/* Divider */}
            <div className="h-4 w-px bg-white/10 mx-0.5"></div>

            {/* Auth */}
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                >
                  {t?.auth?.login ?? 'Connexion'}
                </Link>
                <Link
                  href="/register"
                  className="px-2 py-1 text-[11px] bg-white text-black hover:bg-gray-200 transition-colors rounded font-medium"
                >
                  {t?.auth?.register ?? 'Inscription'}
                </Link>
              </>
            ) : (
              <>
                {/* Dashboard - text on xl, icon on smaller */}
                <Link
                  href="/dashboard"
                  className="px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                  title={t?.nav?.dashboard ?? 'Dashboard'}
                >
                  <span className="hidden xl:inline">{t?.nav?.dashboard ?? 'Dashboard'}</span>
                  <span className="xl:hidden">📊</span>
                </Link>
                {/* Profile */}
                <Link
                  href={artistProfileLink}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                  title={t?.nav?.profile ?? 'Profil'}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-5 h-5 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px]">
                      👤
                    </div>
                  )}
                  <span className="hidden xl:inline">{t?.nav?.profile ?? 'Profil'}</span>
                </Link>
                {/* Messages */}
                <Link
                  href="/messages"
                  className="relative px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                  title={t?.nav?.messages ?? 'Messages'}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                {/* Playlists Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                    className="px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                    title="Playlists"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                  <AnimatePresence>
                    {showPlaylistMenu && (
                    <>
                      {/* Backdrop to close menu when clicking outside */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowPlaylistMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] rounded-lg shadow-xl border border-white/10 overflow-hidden z-[101]"
                      >
                        <Link
                          href="/liked-songs"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                          onClick={() => setShowPlaylistMenu(false)}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                          </svg>
                          <span className="text-sm font-medium">Playlist Musique</span>
                        </Link>
                        <div className="h-px bg-white/10"></div>
                        <Link
                          href="/liked-videos"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                          onClick={() => setShowPlaylistMenu(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium">Playlist Vidéos</span>
                        </Link>
                      </motion.div>
                    </>
                  )}
                  </AnimatePresence>
                </div>
                {/* Settings */}
                <Link
                  href="/settings"
                  className="px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                  title={t?.nav?.settings ?? 'Settings'}
                >
                  <img src="/icons/dark/settings.svg" alt="Settings" className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={async () => {
                    if (loggingOut) return;
                    setLoggingOut(true);
                    try {
                      await signOut();
                    } catch (e) {
                      console.error('[Header] Logout error:', e);
                    } finally {
                      window.location.href = '/';
                    }
                  }}
                  className="px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  title={t?.auth?.logout ?? 'Déconnexion'}
                >
                  <span className="hidden xl:inline">{loggingOut ? '...' : (t?.auth?.logout ?? 'Déconnexion')}</span>
                  <span className="xl:hidden">{loggingOut ? '...' : '🚪'}</span>
                </button>
              </>
            )}

            {/* Langue */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-gray-300 hover:text-white text-[11px] cursor-pointer transition-colors border-none outline-none"
              aria-label="Sélecteur de langue"
            >
              <option value="fr" className="bg-black">FR</option>
              <option value="en" className="bg-black">EN</option>
              <option value="es" className="bg-black">ES</option>
            </select>

            {/* Switch thème - compact */}
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              className="relative w-12 h-6 rounded-full border border-white/20 bg-white/10 transition"
              title={isDark ? 'Thème sombre' : 'Thème clair'}
            >
              {/* Lune */}
              <svg viewBox="0 0 24 24" className={`absolute left-0.5 top-0.5 w-4 h-4 ${isDark ? 'opacity-100' : 'opacity-50'}`}>
                <path fill="currentColor" d="M12 2a1 1 0 0 1 .97 1.243A8 8 0 1 0 20.757 11a1 1 0 0 1 1.243-.97A10 10 0 1 1 12 2z"/>
              </svg>
              {/* Soleil */}
              <svg viewBox="0 0 24 24" className={`absolute right-0.5 top-0.5 w-4 h-4 ${isDark ? 'opacity-50' : 'opacity-100'}`}>
                <path fill="currentColor" d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79l1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm8.83-2.95l1.79-1.79l-1.79-1.79l-1.79 1.79l1.79 1.79zM17.24 4.84l1.79 1.79l1.79-1.79l-1.79-1.79l-1.79 1.79zM20 13h3v-2h-3v2zM11 1v3h2V1h-2zM4.22 17.66l-1.79 1.79l1.79 1.79l1.79-1.79l-1.79-1.79zM12 6a6 6 0 1 0 .001 12A6 6 0 0 0 12 6z"/>
              </svg>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Mobile (< lg) */}
        <div className="lg:hidden w-full h-16 grid grid-cols-[48px,1fr,auto,48px] items-center gap-2 px-3">
          {/* Bloc 1: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-white/20 hover:bg-white/10"
            aria-label="Ouvrir le menu"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/>
            </svg>
          </button>

          {/* Bloc 2: logo centré */}
          <Link href="/" className="justify-self-center">
            <img src="/logo-white.png" alt="KracRadio" className="h-9 w-auto object-contain" />
          </Link>

          {/* Bloc 3: langue */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="justify-self-end bg-transparent text-white border border-white/20 rounded-md px-2 py-1 text-sm"
            aria-label="Langue"
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>

          {/* Bloc 4: thème */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-white/20 hover:bg-white/10"
            aria-label="Changer de thème"
            title={isDark ? 'Sombre' : 'Clair'}
          >
            {isDark ? (
              // lune
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12 2a1 1 0 0 1 .97 1.243A8 8 0 1 0 20.757 11a1 1 0 0 1 1.243-.97A10 10 0 1 1 12 2z"/>
              </svg>
            ) : (
              // soleil
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79l1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm8.83-2.95l1.79-1.79l-1.79-1.79l-1.79 1.79l1.79 1.79zM17.24 4.84l1.79 1.79l1.79-1.79l-1.79-1.79l-1.79 1.79zM20 13h3v-2h-3v2zM11 1v3h2V1h-2zM4.22 17.66l-1.79 1.79l1.79 1.79l1.79-1.79l-1.79-1.79zM12 6a6 6 0 1 0 .001 12A6 6 0 0 0 12 6z"/>
              </svg>
            )}
          </button>
        </div>
      </motion.header>

      {/* Menu Mobile overlay */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
