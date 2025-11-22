// src/components/MobileMenu.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
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

export default function MobileMenu({ open, onClose }) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();

  const [channelsOpen, setChannelsOpen] = React.useState(false);

  // Ferme la liste des chaînes quand on navigue vers une chaîne
  React.useEffect(() => {
    if (location.pathname.startsWith('/channel/')) setChannelsOpen(false);
  }, [location.pathname]);

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
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="home" />
            <span className="text-sm font-medium">{t.nav.home}</span>
          </NavLink>

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
                  <NavLink
                    to={`/channel/${c.key}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${itemHover} ${
                        isActive ? activeCls : ''
                      }`
                    }
                  >
                    <img
                      src={c.image || '/channels/default.webp'}
                      alt=""
                      className="w-5 h-5 rounded object-cover border border-current/10"
                      loading="lazy"
                    />
                    <span className="truncate">{c.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Autres pages */}
          <NavLink
            to="/articles"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="paper" />
            <span className="text-sm font-medium">{t.nav.articles}</span>
          </NavLink>

          <NavLink
            to="/artists"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="artist" />
            <span className="text-sm font-medium">{t.nav.artists}</span>
          </NavLink>

          <NavLink
            to="/podcasts"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="mic" />
            <span className="text-sm font-medium">{t.nav.podcasts}</span>
          </NavLink>

          <NavLink
            to="/spotify"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="spotify" />
            <span className="text-sm font-medium">{t.nav.spotify}</span>
          </NavLink>

          <NavLink
            to="/schedule"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="calendar" />
            <span className="text-sm font-medium">{t.nav.schedule}</span>
          </NavLink>

          <NavLink
            to="/about"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="info" />
            <span className="text-sm font-medium">{t.nav.about}</span>
          </NavLink>

          <NavLink
            to="/contact"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${itemHover} ${isActive ? activeCls : ''}`
            }
          >
            <IconImg name="chat" />
            <span className="text-sm font-medium">{t.nav.contact}</span>
          </NavLink>

          {/* Divider */}
          <div className={`my-3 border-t ${border}`} />

          {/* Actions Section */}
          {user && (
            <NavLink
              to="/submit-music"
              onClick={onClose}
              className="mx-1 mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 text-sm font-medium"
            >
              🎵 <span>{t?.nav?.submitMusic ?? 'Submit Music'}</span>
            </NavLink>
          )}

          <a
            href="/kracradio.apk"
            download
            className="mx-1 mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/5 hover:bg-green-500/10 text-sm font-medium"
          >
            📱 <span>Android APK</span>
          </a>

          {/* External Links */}
          <div className="flex items-center gap-2 px-1">
            <a
              href="https://store.kracradio.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border ${border} ${itemHover} text-xs`}
            >
              <IconImg name="store" className="w-4 h-4" />
              <span className="truncate">{t?.site?.store ?? 'Store'}</span>
            </a>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=GUPL4K5WR3ZG4"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border ${border} ${itemHover} text-xs`}
            >
              <IconImg name="donation" className="w-4 h-4" />
              <span className="truncate">{t?.site?.donation ?? 'Donate'}</span>
            </a>
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
