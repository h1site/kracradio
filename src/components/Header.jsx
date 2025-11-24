// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useCommunity';
import { useUI } from '../context/UIContext';
import MobileMenu from './MobileMenu';

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { isDark, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { isDesktop, sidebarOpen, openSidebar } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Lien du profil: si slug configuré → profil public, sinon → dashboard perso
  const profileLink = profile?.artist_slug ? `/profile/${profile.artist_slug}` : '/profile';

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a] text-white border-b border-white/5 shadow-lg">
        {/* Desktop (≥1024px) */}
        <div className="hidden lg:flex w-full h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img src="/logo-white.png" alt="Logo" className="h-10 w-auto object-contain" />
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

          <div className="flex items-center gap-1.5">
            {/* Notre Boutique */}
            <a
              href="https://store.kracradio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20"
            >
              {t?.site?.store ?? 'Boutique'}
            </a>
            {/* Donation */}
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=GUPL4K5WR3ZG4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20"
            >
              {t?.site?.donation ?? 'Donation'}
            </a>
            {/* KEMP3.app */}
            <a
              href="https://kemp3.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20"
            >
              KEMP3
            </a>
            {/* Android APP */}
            <a
              href="/kracradio.apk"
              download
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20 flex items-center gap-1.5"
              title={lang === 'fr' ? 'Télécharger l\'application Android' : lang === 'es' ? 'Descargar aplicación Android' : 'Download Android App'}
            >
              📱 {lang === 'fr' ? 'Android APP' : lang === 'es' ? 'Android APP' : 'Android APP'}
            </a>

            {/* Submit Music - Only for authenticated users */}
            {user && (
              <Link
                to="/submit-music"
                className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white transition-colors rounded border border-white/20 flex items-center gap-1.5"
              >
                🎵 {lang === 'fr' ? 'Soumission Musique' : lang === 'es' ? 'Enviar Música' : 'Submit Music'}
              </Link>
            )}

            {/* Divider */}
            <div className="h-4 w-px bg-white/10 mx-1"></div>

            {/* Auth */}
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {t?.auth?.login ?? 'Connexion'}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs bg-white text-black hover:bg-gray-200 transition-colors rounded font-medium"
                >
                  {t?.auth?.register ?? 'Inscription'}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={profileLink}
                  className="px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {t?.nav?.profile ?? 'Profil'}
                </Link>
                <Link
                  to="/settings"
                  className="px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
                  title={t?.nav?.settings ?? 'Settings'}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M17 15l3-3-3-3v2h-4v2h4v2zM7 9l-3 3 3 3v-2h4v-2H7V9z"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                  </svg>
                </Link>
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={async () => {
                    if (loggingOut) return;
                    setLoggingOut(true);
                    console.log('[Header] Logout button clicked');
                    try {
                      await signOut();
                      console.log('[Header] signOut completed, redirecting...');
                    } catch (e) {
                      console.error('[Header] Logout error:', e);
                    } finally {
                      window.location.href = '/';
                    }
                  }}
                  className="px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  {loggingOut ? '...' : (t?.auth?.logout ?? 'Déconnexion')}
                </button>
              </>
            )}

            {/* Langue */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-gray-300 hover:text-white text-xs cursor-pointer transition-colors border-none outline-none"
              aria-label="Sélecteur de langue"
            >
              <option value="fr" className="bg-black">FR</option>
              <option value="en" className="bg-black">EN</option>
              <option value="es" className="bg-black">ES</option>
            </select>

            {/* Switch thème */}
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              className="relative w-14 h-8 rounded-full border border-white/20 bg-white/10 transition"
              title={isDark ? 'Thème sombre' : 'Thème clair'}
            >
              {/* Lune */}
              <svg viewBox="0 0 24 24" className={`absolute left-1 top-1.5 w-5 h-5 ${isDark ? 'opacity-100' : 'opacity-50'}`}>
                <path fill="currentColor" d="M12 2a1 1 0 0 1 .97 1.243A8 8 0 1 0 20.757 11a1 1 0 0 1 1.243-.97A10 10 0 1 1 12 2z"/>
              </svg>
              {/* Soleil */}
              <svg viewBox="0 0 24 24" className={`absolute right-1 top-1.5 w-5 h-5 ${isDark ? 'opacity-50' : 'opacity-100'}`}>
                <path fill="currentColor" d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79l1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm8.83-2.95l1.79-1.79l-1.79-1.79l-1.79 1.79l1.79 1.79zM17.24 4.84l1.79 1.79l1.79-1.79l-1.79-1.79l-1.79 1.79zM20 13h3v-2h-3v2zM11 1v3h2V1h-2zM4.22 17.66l-1.79 1.79l1.79 1.79l1.79-1.79l-1.79-1.79zM12 6a6 6 0 1 0 .001 12A6 6 0 0 0 12 6z"/>
              </svg>
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
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
          <Link to="/" className="justify-self-center">
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
      </header>

      {/* Menu Mobile overlay */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
