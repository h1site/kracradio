'use client';
// src/pages/Schedule.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import daily from '../data/daily-schedule.json';
import { useUI } from '../context/UIContext';

const KRAC_KEY = 'kracradio';

function toTodayDate(timeStr) {
  // timeStr format "HH:MM" where HH can be "24"
  const [hhRaw, mmRaw] = (timeStr || '00:00').split(':');
  const hh = parseInt(hhRaw, 10);
  const mm = parseInt(mmRaw, 10);
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (hh >= 24) {
    // 24:00 -> tomorrow 00:00
    d.setDate(d.getDate() + 1);
    d.setHours(0, mm || 0, 0, 0);
  } else {
    d.setHours(hh, mm || 0, 0, 0);
  }
  return d;
}

function fmtRange(start, end, lang) {
  const opt = { hour: '2-digit', minute: '2-digit' };
  return `${new Intl.DateTimeFormat(lang, opt).format(start)} — ${new Intl.DateTimeFormat(lang, opt).format(end)}`;
}

export default function Schedule() {
  const { lang, t } = useI18n();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();

  const containerStyle = {
    paddingLeft: isDesktop ? (sidebarOpen ? sidebarWidth + 32 : 32) : 32,
    paddingRight: isDesktop ? 32 : 32,
    transition: 'padding-left 300ms ease',
  };

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';

  // Construire les 24 h du JSON en objets avec Date
  const segments = useMemo(() => {
    const arr = (daily || []).map((it, idx) => {
      const start = toTodayDate(it.start);
      const end = toTodayDate(it.end);
      return {
        id: `${start.toISOString()}-${idx}`,
        title: (it.title || '').trim(),
        start,
        end,
        image: it.image || kracImage,
        description: it.description || ''
      };
    }).sort((a, b) => a.start - b.start);
    return arr;
  }, [kracImage]);

  // Now & Next
  const { current, next } = useMemo(() => {
    const now = Date.now();
    let cur = null;
    let nxt = null;
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (now >= s.start.getTime() && now < s.end.getTime()) {
        cur = s;
        nxt = segments[(i + 1) % segments.length] || null;
        break;
      }
    }
    if (!cur && segments.length) {
      const after = segments.find((s) => s.start.getTime() > now);
      nxt = after || segments[0];
    }
    return { current: cur, next: nxt };
  }, [segments]);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date());
  }, [lang]);
  
  return (
    <div style={containerStyle} className="min-h-screen">
      {/* En-tête */}
      <header className="relative -mx-8 -mt-8 mb-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Schedule"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative pl-[60px] md:pl-[100px] pr-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-black uppercase text-white">
            {t?.nav?.schedule || 'Horaire'}
          </h1>
          <p className="text-lg text-gray-200 font-semibold mt-4">
            {todayLabel}
          </p>
        </div>
      </header>

      {/* Grille d'horaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
        {segments.map((it) => {
          const isCurrent = current?.id === it.id;
          const isNext = next?.id === it.id;

          return (
            <article
              key={it.id}
              className={`group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${
                isCurrent ? 'ring-4 ring-red-500' : 'ring-1 ring-black/10'
              }`}
            >
              <div className="relative h-80">
                <img
                  src={it.image}
                  alt={it.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                      {t?.schedule?.nowPlaying || 'En direct'}
                    </span>
                  </div>
                )}

                {isNext && !isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider">
                      {t?.schedule?.upNext || 'À suivre'}
                    </span>
                  </div>
                )}

                <div className="absolute left-5 right-5 bottom-5 text-white">
                  <p className="font-semibold text-red-400 mb-1">
                    {fmtRange(it.start, it.end, lang)}
                  </p>
                  <h3 className="text-2xl font-black uppercase mb-2 drop-shadow-lg">
                    {it.title}
                  </h3>
                  <p className="text-white/80 text-sm line-clamp-2">
                    {it.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Info bas de page */}
      <div className="pb-8">
        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 p-5">
          <h3 className="text-sm font-bold dark:text-white uppercase mb-2">
            {t?.nav?.channels || 'Chaînes spécialisées'}
          </h3>
          <p className="text-sm text-black/70 dark:text-white/70">
            {t?.schedule?.otherAreRotation ||
              'Les autres chaînes spécialisées sont en rotation musicale 24/7.'}
          </p>
        </div>
      </div>

      {/* Cale mobile pour le player */}
      <div
        className="sm:hidden"
        style={{ height: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}
      />
    </div>
  );
}
