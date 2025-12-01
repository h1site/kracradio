'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

function Item({ href, iconName, label, onClick, pathname }) {
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-red-500 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
      ].join(' ')}
    >
      <span className="w-5 h-5 shrink-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
        <IconImg name={iconName} className="w-5 h-5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { sidebarOpen, isDesktop, openSidebar, closeSidebar, toggleSidebar, sidebarWidth } = useUI();
  const pathname = usePathname();

  const bg = isDark
    ? 'bg-gray-950/95 backdrop-blur-xl'
    : 'bg-white/95 backdrop-blur-xl';
  const border = isDark ? 'border-white/5' : 'border-gray-200';
  const btnFrame = isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200';

  const [channelsOpen, setChannelsOpen] = React.useState(false);
  React.useEffect(() => {
    if (pathname.startsWith('/channel/')) setChannelsOpen(false);
  }, [pathname]);

  const HEADER_H = 64;
  const OPEN_BTN_TOP = HEADER_H + 20;

  return (
    <>
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
            <Link href="/" className="flex-shrink-0">
              <img
                src={isDark ? '/logo-white.png' : '/logo-black.png'}
                alt="KracRadio"
                className="h-10 w-40 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
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
            <Item href="/" iconName="home" label={t.nav.home} pathname={pathname} />

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
                        <Link
                          href={`/channel/${c.key}`}
                          className={[
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200',
                            pathname === `/channel/${c.key}`
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5',
                          ].join(' ')}
                        >
                          <img
                            src={c.image || '/channels/default.webp'}
                            alt=""
                            className="w-5 h-5 rounded object-cover"
                            loading="lazy"
                          />
                          <span className="truncate font-medium">{c.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Other links */}
            <Item href="/feed" iconName="chat" label={t.nav.feed} pathname={pathname} />
            <Item href="/articles" iconName="paper" label={t.nav.articles} pathname={pathname} />
            <Item href="/artists" iconName="artist" label={t.nav.members} pathname={pathname} />
            <Item href="/podcasts" iconName="mic" label={t.nav.podcasts} pathname={pathname} />
            <Item href="/videos" iconName="video" label={t.nav.videos} pathname={pathname} />
            <Item href="/charts" iconName="chart" label={t.nav.charts} pathname={pathname} />
            <Item href="/spotify" iconName="spotify" label={t.nav.spotify} pathname={pathname} />
            <Item href="/schedule" iconName="calendar" label={t.nav.schedule} pathname={pathname} />
            <Item href="/about" iconName="info" label={t.nav.about} pathname={pathname} />
            <Item href="/contact" iconName="chat" label={t.nav.contact} pathname={pathname} />

            {/* Socials - Integrated into navigation */}
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-white/5">
              <div className="flex items-center justify-center gap-3">
                <a
                  href="https://www.facebook.com/KracRadio"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/kracradio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z"/>
                  </svg>
                </a>
                <a
                  href="https://x.com/KracRadio"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-black transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
