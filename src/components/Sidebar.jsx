import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { useUI } from '../context/UIContext';
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

function Item({ to, iconName, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2 rounded-lg transition',
          isActive
            ? 'dark:bg-white/15 dark:text-white bg-black/5 text-black'
            : 'dark:hover:bg-white/10 dark:text-white hover:bg-black/5 text-black',
        ].join(' ')
      }
    >
      <span className="w-5 h-5 shrink-0"><IconImg name={iconName} /></span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { sidebarOpen, isDesktop, openSidebar, closeSidebar, toggleSidebar, sidebarWidth } = useUI();
  const location = useLocation();

  const bg = isDark ? 'bg-[#1e1e1e] text-white' : 'bg-white text-black';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const btnFrame = isDark ? 'border-white/20 hover:bg-white/10' : 'border-black/15 hover:bg-black/5';

  const [channelsOpen, setChannelsOpen] = React.useState(false);
  React.useEffect(() => {
    if (location.pathname.startsWith('/channel/')) setChannelsOpen(false);
  }, [location.pathname]);

  const HEADER_H = 64; // h-16
  const OPEN_BTN_TOP = HEADER_H + 12;

  return (
    <>
      {/* Bouton d’ouverture — Desktop quand fermée */}
      {!sidebarOpen && isDesktop && (
        <div className="hidden lg:block fixed z-40" style={{ top: OPEN_BTN_TOP, left: 12 }}>
          <button
            type="button"
            onClick={openSidebar}
            className={`w-9 h-9 rounded-lg border transition ${btnFrame} flex items-center justify-center`}
            aria-label="Ouvrir le menu"
            title="Ouvrir le menu"
          >
            {/* chevron droit inline */}
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6l-6-6l-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar (toujours montée en desktop pour animer le slide) */}
      <aside
        className={[
          'hidden lg:flex fixed left-0 top-16 bottom-16 z-40',
          bg, `border-r ${border}`,
          // animation de slide
          'transform transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: sidebarWidth }}
      >
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          {/* En-tête + bouton fermer */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase font-semibold opacity-70">Menu</div>
            <button
              type="button"
              onClick={toggleSidebar}
              className={`w-8 h-8 rounded-lg border transition ${btnFrame} flex items-center justify-center`}
              aria-label="Fermer le menu"
              title="Fermer le menu"
            >
              {/* chevron gauche inline */}
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-auto pr-1">
            <Item to="/" iconName="home" label={t.nav.home} />

            {/* Accordéon : Chaînes */}
            <button
              type="button"
              onClick={() => setChannelsOpen((v) => !v)}
              aria-expanded={channelsOpen}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 shrink-0"><IconImg name="list" /></span>
                <span className="text-sm font-medium">{t.nav.channels}</span>
              </span>
              <span
                className="w-5 h-5 shrink-0 transition-transform"
                style={{ transform: channelsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                {/* chevron bas inline */}
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M7 10l5 5l5-5z" />
                </svg>
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                channelsOpen ? 'max-h-[60vh] opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <ul className="pl-4 ml-3 border-l border-current/10 space-y-1">
                {channels.map((c) => (
                  <li key={c.key}>
                    <NavLink
                      to={`/channel/${c.key}`}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition',
                          isActive
                            ? 'dark:bg-white/15 dark:text-white bg-black/5 text-black'
                            : 'dark:hover:bg-white/10 dark:text-white hover:bg-black/5 text-black',
                        ].join(' ')
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

            {/* Autres liens */}
            <Item to="/articles" iconName="paper" label={t.nav.articles} />
            <Item to="/artists" iconName="artist" label={t.nav.artists} />
            <Item to="/podcasts" iconName="mic" label={t.nav.podcasts} />
            <Item to="/spotify" iconName="spotify" label={t.nav.spotify} />
            <Item to="/schedule" iconName="calendar" label={t.nav.schedule} />
            <Item to="/about" iconName="info" label={t.nav.about} />
            <Item to="/contact" iconName="chat" label={t.nav.contact} />
          </nav>

          {/* Socials */}
          <div className="pt-3 mt-3 border-t border-current/10">
            <div className="flex items-center justify-center gap-5">
              <a href="https://www.facebook.com/KracRadio" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <IconImg name="facebook" className="w-6 h-6" />
              </a>
              <a href="https://www.instagram.com/kracradio/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <IconImg name="instagram" className="w-6 h-6" />
              </a>
              <a href="https://x.com/KracRadio" target="_blank" rel="noopener noreferrer" aria-label="X">
                <IconImg name="x" className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
