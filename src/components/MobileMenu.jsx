'use client';
// src/components/MobileMenu.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { channels } from '../data/channels';

function IconImg({ name, alt = '', className = 'w-5 h-5' }) {
  const { isDark } = useTheme();
  const src = `/icons/${isDark ? 'dark' : 'light'}/${name}.svg`;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = '/icons/default.svg';
      }}
    />
  );
}

function NavItem({ href, onClick, pathname, itemHover, activeCls, children }) {
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`}
    >
      {children}
    </Link>
  );
}

export default function MobileMenu({ open, onClose }) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const pathname = usePathname();
  const [channelsOpen, setChannelsOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Ferme la liste des chaînes quand on navigue vers une chaîne
  React.useEffect(() => {
    if (pathname.startsWith('/channel/')) setChannelsOpen(false);
  }, [pathname]);

  // Fermer au clavier (Esc)
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelBg = isDark ? 'bg-[#1e1e1e] text-white' : 'bg-white text-black';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const itemHover = isDark ? 'hover:bg-white/10' : 'hover:bg-black/5';
  const activeCls = 'bg-black/5 text-black dark:bg-white/15 dark:text-white';

  return (
    <div className="lg:hidden fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panneau (entre header et player) */}
      <div className={`absolute left-0 right-0 top-16 bottom-16 ${panelBg} border-t ${border} overflow-auto`}>
        {/* Entête */}
        <div className={`flex items-center justify-between p-3 border-b ${border}`}>
          <div className="text-xs uppercase font-semibold opacity-70">Menu</div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-lg border ${border} flex items-center justify-center`}
            aria-label="Fermer"
            title="Fermer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {/* Accueil */}
          <NavItem href="/" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="home" />
            <span className="text-sm font-medium">{t.nav.home}</span>
          </NavItem>

          {/* Accordéon : Chaînes */}
          <button
            type="button"
            onClick={() => setChannelsOpen((v) => !v)}
            aria-expanded={channelsOpen}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${itemHover}`}
          >
            <span className="flex items-center gap-3">
              <IconImg name="list" />
              <span className="text-sm font-medium">{t.nav.channels}</span>
            </span>
            <span
              className="w-5 h-5 shrink-0 transition-transform"
              style={{ transform: channelsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              channelsOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <ul className="mt-1 pl-5 ml-2 border-l border-current/10 space-y-1">
              {channels.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/channel/${c.key}`}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${itemHover} ${
                      pathname === `/channel/${c.key}` ? activeCls : ''
                    }`}
                  >
                    <img
                      src={c.image || '/channels/default.webp'}
                      alt=""
                      className="w-5 h-5 rounded object-cover border border-current/10"
                      loading="lazy"
                    />
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Autres pages */}
          <NavItem href="/feed" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="chat" />
            <span className="text-sm font-medium">{t.nav.feed}</span>
          </NavItem>

          <NavItem href="/articles" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="paper" />
            <span className="text-sm font-medium">{t.nav.articles}</span>
          </NavItem>

          <NavItem href="/artists" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="artist" />
            <span className="text-sm font-medium">{t.nav.members}</span>
          </NavItem>

          <NavItem href="/podcasts" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="mic" />
            <span className="text-sm font-medium">{t.nav.podcasts}</span>
          </NavItem>

          <NavItem href="/videos" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="video" />
            <span className="text-sm font-medium">{t.nav.videos}</span>
          </NavItem>

          <NavItem href="/charts" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="chart" />
            <span className="text-sm font-medium">{t.nav.charts}</span>
          </NavItem>

          <NavItem href="/spotify" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="spotify" />
            <span className="text-sm font-medium">{t.nav.spotify}</span>
          </NavItem>

          <NavItem href="/schedule" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="calendar" />
            <span className="text-sm font-medium">{t.nav.schedule}</span>
          </NavItem>

          <NavItem href="/about" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="info" />
            <span className="text-sm font-medium">{t.nav.about}</span>
          </NavItem>

          <NavItem href="/contact" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
            <IconImg name="chat" />
            <span className="text-sm font-medium">{t.nav.contact}</span>
          </NavItem>

          {/* Divider */}
          <div className={`my-3 border-t ${border}`} />

          {/* Auth Section */}
          {!user ? (
            <>
              <NavItem href="/login" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" />
                </svg>
                <span className="text-sm font-medium">{t?.auth?.login ?? 'Connexion'}</span>
              </NavItem>
              <Link
                href="/register"
                onClick={onClose}
                className="mx-1 mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-white text-black text-sm font-medium"
              >
                <span>{t?.auth?.register ?? 'Inscription'}</span>
              </Link>
            </>
          ) : (
            <>
              {/* Profile */}
              <NavItem href="/profile" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-sm font-medium">{t?.nav?.profile ?? 'Profil'}</span>
              </NavItem>

              {/* Dashboard */}
              <NavItem href="/dashboard" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                <span className="text-sm font-medium">{t?.nav?.dashboard ?? 'Dashboard'}</span>
              </NavItem>

              {/* Messages */}
              <NavItem href="/messages" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
                <div className="relative">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">{t?.nav?.messages ?? 'Messages'}</span>
                {unreadCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavItem>

              {/* Liked Songs */}
              <NavItem href="/liked-songs" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-sm font-medium">{t?.likedSongs?.title ?? 'Chansons aimées'}</span>
              </NavItem>

              {/* Settings */}
              <NavItem href="/settings" onClick={onClose} pathname={pathname} itemHover={itemHover} activeCls={activeCls}>
                <IconImg name="settings" />
                <span className="text-sm font-medium">{t?.site?.settings ?? 'Paramètres'}</span>
              </NavItem>

              {/* Logout */}
              <button
                type="button"
                disabled={loggingOut}
                onClick={async () => {
                  if (loggingOut) return;
                  setLoggingOut(true);
                  try {
                    await signOut();
                  } catch (e) {
                    console.error('[MobileMenu] Logout error:', e);
                  } finally {
                    window.location.href = '/';
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} disabled:opacity-50`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                <span className="text-sm font-medium">{loggingOut ? '...' : (t?.auth?.logout ?? 'Déconnexion')}</span>
              </button>
            </>
          )}

          {/* Divider */}
          <div className={`my-3 border-t ${border}`} />

          {/* Actions Section */}
          {user && (
            <Link
              href="/submit-music"
              onClick={onClose}
              className="mx-1 mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 text-sm font-medium"
            >
              🎵 <span>{t?.nav?.submitMusic ?? 'Submit Music'}</span>
            </Link>
          )}

          <a
            href="/kracradio.apk"
            download
            className="mx-1 mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/5 hover:bg-green-500/10 text-sm font-medium"
          >
            📱 <span>Android APK</span>
          </a>

          <Link
            href="/widget"
            onClick={onClose}
            className="mx-1 mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Widget</span>
          </Link>

          {/* External Links */}
          <div className="flex items-center gap-2 px-1">
            <a
              href="https://store.kracradio.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border ${border} ${itemHover} text-xs`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
              </svg>
              <span className="truncate">{t?.site?.store ?? 'Store'}</span>
            </a>
            <Link
              href="/donation"
              onClick={onClose}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border ${border} ${itemHover} text-xs`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="truncate">{t?.site?.donation ?? 'Donate'}</span>
            </Link>
          </div>

          {/* Social Links */}
          <div className={`mt-3 pt-3 border-t ${border} flex items-center justify-center gap-6`}>
            <a
              href="https://www.facebook.com/KracRadio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="opacity-70 hover:opacity-100 transition"
            >
              <IconImg name="facebook" className="w-6 h-6" />
            </a>
            <a
              href="https://www.instagram.com/kracradio/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="opacity-70 hover:opacity-100 transition"
            >
              <IconImg name="instagram" className="w-6 h-6" />
            </a>
            <a
              href="https://x.com/KracRadio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="opacity-70 hover:opacity-100 transition"
            >
              <IconImg name="x" className="w-6 h-6" />
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
