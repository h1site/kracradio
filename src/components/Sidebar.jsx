import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { useUI } from '../context/UIContext';
import { channels } from '../data/channels';

function IconImg({ name, alt = '', className = 'w-6 h-6' }) {
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
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-red-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
        ].join(' ')
      }
    >
      <span className="w-5 h-5 shrink-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
        <IconImg name={iconName} className="w-5 h-5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { sidebarOpen, isDesktop, openSidebar, closeSidebar, toggleSidebar, sidebarWidth } = useUI();
  const location = useLocation();

  const bg = isDark
    ? 'bg-gray-950/95 backdrop-blur-xl'
    : 'bg-white/95 backdrop-blur-xl';
  const border = isDark ? 'border-white/5' : 'border-gray-200';
  const btnFrame = isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200';

  const [channelsOpen, setChannelsOpen] = React.useState(false);
  React.useEffect(() => {
    if (location.pathname.startsWith('/channel/')) setChannelsOpen(false);
  }, [location.pathname]);

  const HEADER_H = 64;
  const OPEN_BTN_TOP = HEADER_H + 20;

  return (
    <>
      {/* Open Button - Desktop when closed */}
      {!sidebarOpen && isDesktop && (
        <div className="hidden lg:block fixed z-40" style={{ top: OPEN_BTN_TOP, left: 16 }}>
          <button
            type="button"
            onClick={openSidebar}
            className={`w-10 h-10 rounded-xl transition-all duration-200 shadow-md ${btnFrame} flex items-center justify-center`}
            aria-label="Ouvrir le menu"
            title="Ouvrir le menu"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6l-6-6l-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={[
          'hidden lg:flex fixed left-0 top-0 bottom-0 z-50',
          bg, `border-r ${border}`,
          'transform transition-transform duration-500 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: sidebarWidth }}
      >
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Header + Close Button */}
          <div className="flex items-center justify-between mb-8">
            <img
              src={isDark ? '/logo-white.png' : '/logo-black.png'}
              alt="KracRadio"
              className="h-8 w-auto object-contain"
            />
            <button
              type="button"
              onClick={toggleSidebar}
              className={`w-8 h-8 rounded-lg transition-all duration-200 ${btnFrame} flex items-center justify-center`}
              aria-label="Fermer le menu"
              title="Fermer le menu"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2">
            <Item to="/" iconName="home" label={t.nav.home} />

            {/* Accordion: Channels */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setChannelsOpen((v) => !v)}
                aria-expanded={channelsOpen}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 shrink-0 flex items-center justify-center opacity-70">
                    <IconImg name="list" className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium">{t.nav.channels}</span>
                </span>
                <span
                  className="w-4 h-4 shrink-0 transition-transform duration-200 opacity-50"
                  style={{ transform: channelsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M7 10l5 5l5-5z" />
                  </svg>
                </span>
              </button>

              <div
                className={`pl-6 grid transition-all duration-300 ease-in-out ${
                  channelsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-0.5 py-1">
                    {channels.map((c) => (
                      <li key={c.key}>
                        <NavLink
                          to={`/channel/${c.key}`}
                          className={({ isActive }) =>
                            [
                              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200',
                              isActive
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5',
                            ].join(' ')
                          }
                        >
                          <img
                            src={c.image || '/channels/default.webp'}
                            alt=""
                            className="w-5 h-5 rounded object-cover"
                            loading="lazy"
                          />
                          <span className="truncate font-medium">{c.name}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Other links */}
            <Item to="/articles" iconName="paper" label={t.nav.articles} />
            <Item to="/artists" iconName="artist" label={t.nav.artists} />
            <Item to="/podcasts" iconName="mic" label={t.nav.podcasts} />
            <Item to="/spotify" iconName="spotify" label={t.nav.spotify} />
            <Item to="/schedule" iconName="calendar" label={t.nav.schedule} />
            <Item to="/about" iconName="info" label={t.nav.about} />
            <Item to="/contact" iconName="chat" label={t.nav.contact} />
          </nav>

          {/* Socials */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/5">
            <div className="flex items-center justify-center gap-4">
              <a href="https://www.facebook.com/KracRadio" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white transition-all duration-200">
                <IconImg name="facebook" className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/kracradio/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-200">
                <IconImg name="instagram" className="w-5 h-5" />
              </a>
              <a href="https://x.com/KracRadio" target="_blank" rel="noopener noreferrer" aria-label="X" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-900 hover:text-white transition-all duration-200">
                <IconImg name="x" className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
