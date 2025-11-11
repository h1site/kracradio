// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useCommunity';
import MobileMenu from './MobileMenu';

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { isDark, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Lien du profil: si slug configuré → profil public, sinon → dashboard perso
  const profileLink = profile?.artist_slug ? `/profile/${profile.artist_slug}` : '/profile';

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-[#1e1e1e] text-white border-b border-[#2a2a2a]">
        {/* Desktop (≥1024px) */}
        <div className="hidden lg:flex w-full h-16 items-center justify-between px-5">
          <Link to="/" className="flex items-center">
            <img src="/logo-white.png" alt="Logo" className="h-10 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Notre Boutique */}
            <a
              href="https://store.kracradio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
            >
              {t?.site?.store ?? 'Notre Boutique'}
            </a>
            {/* Donation */}
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=GUPL4K5WR3ZG4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
            >
              {t?.site?.donation ?? 'Donation'}
            </a>
            {/* KEMP3.app */}
            <a
              href="https://kemp3.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
            >
              KEMP3.app
            </a>

            {/* Auth — même style que les autres boutons, sans changer le look */}
            {!user ? (
              <>
                <Link
                  to="/auth/login"
                  className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
                >
                  {t?.auth?.login ?? 'Connexion'}
                </Link>
                <Link
                  to="/auth/register"
                  className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
                >
                  {t?.auth?.register ?? 'Inscription'}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={profileLink}
                  className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
                >
                  {t?.nav?.profile ?? 'Profil'}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    console.log('[Header] Logout button clicked');
                    try {
                      await signOut();
                      console.log('[Header] signOut completed, redirecting...');
                    } catch (e) {
                      console.error('[Header] Logout error:', e);
                      // signOut already cleaned up, even on error
                    } finally {
                      // Always redirect to home page after logout attempt
                      window.location.href = '/';
                    }
                  }}
                  className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
                >
                  {t?.auth?.logout ?? 'Déconnexion'}
                </button>
              </>
            )}

            {/* Langue */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-white border border-white/20 rounded-md px-2 py-1 text-sm"
              aria-label="Sélecteur de langue"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
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
