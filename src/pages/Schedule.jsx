// src/pages/Schedule.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import daily from '../data/daily-schedule.json'; // ← 24 h fixes (title, start, end, image)

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
  }, [daily, kracImage]);

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
    <div className="min-h-screen pl-[30px] ">
      {/* En-tête */}
      <div className="pb-6">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={kracImage}
            alt={krac?.name || 'KracRadio'}
            className="h-12 w-12 rounded-lg"
          />
          <div>
            <h1 className="text-2xl font-bold dark:text-white uppercase">
              {krac?.name || 'KracRadio'}
            </h1>
            <p className="text-sm text-black/70 dark:text-white/70">
              {t?.nav?.schedule || 'Horaire'} — 24h
            </p>
          </div>
        </div>
        <h2 className="text-base font-medium text-black/80 dark:text-white/80">
          {todayLabel}
        </h2>
      </div>

      {/* Grille 4 colonnes x 3 rangées (desktop) / 1 colonne (mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:grid-rows-3 gap-4 pb-6 pr-[30px]">
        {segments.map((it) => {
          const isCurrent = current?.id === it.id;
          const isNext = next?.id === it.id;

          return (
            <article
              key={it.id}
              className={`relative rounded-xl overflow-hidden ${
                isCurrent ? 'ring-2 ring-red-600' : ''
              }`}
            >
              <div className="relative h-64">
                <img
                  src={it.image}
                  alt={it.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase">
                      {t?.schedule?.nowPlaying || 'En lecture'}
                    </span>
                  </div>
                )}

                {isNext && !isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold uppercase">
                      {t?.schedule?.upNext || 'À suivre'}
                    </span>
                  </div>
                )}

                <div className="absolute left-5 right-5 bottom-5">
                  <h3 className="text-white text-xl font-bold uppercase mb-1 drop-shadow-lg">
                    {it.title}
                  </h3>
                  <p className="text-white/90 text-sm font-medium drop-shadow">
                    {fmtRange(it.start, it.end, lang)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Info bas de page */}
      <div className="pb-8 pr-[30px]">
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
