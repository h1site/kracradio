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
    // Assure ordre chronologique et normalise
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

  // Now & Next (local)
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
    // si rien en cours (ex.: juste après 24:00 exact), on définit next = premier block
    if (!cur && segments.length) {
      // next = premier segment dont start > now, sinon le premier
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
    <div className="page-scroll pl-5 pr-5 pt-14">
      {/* En-tête brandée KracRadio */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10">
        <div
          className="relative h-28 sm:h-36 bg-neutral-100 dark:bg-[#0f0f0f]"
          style={{
            backgroundImage: `url(${kracImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(0.9)'
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-4 top-4 flex items-center gap-3">
            <img
              src={kracImage}
              alt={krac?.name || 'KracRadio'}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/90 p-1 shadow"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white uppercase drop-shadow">
                {krac?.name || 'KracRadio'}
              </h1>
              <span className="inline-block mt-1 text-[11px] sm:text-xs px-2 py-1 rounded-full bg-white/90 text-black font-semibold uppercase">
                {t?.nav?.schedule || 'Horaire'} — 24 h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Now / Next */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#151515] p-4">
          <div className="text-xs uppercase tracking-wide mb-3 opacity-80 text-black dark:text-white">
            {t?.site?.nowPlaying || 'En lecture'}
          </div>
          {current ? (
            <div className="flex items-center gap-3">
              <img
                src={current.image}
                alt={current.title}
                className="h-16 w-16 rounded-xl object-cover border border-neutral-200 dark:border-white/10"
              />
              <div className="min-w-0">
                <div className="font-semibold truncate text-black dark:text-white">
                  {current.title}
                </div>
                <div className="text-sm opacity-80 text-black dark:text-white">
                  {fmtRange(current.start, current.end, lang)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70 text-black dark:text-white">—</div>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#151515] p-4">
          <div className="text-xs uppercase tracking-wide mb-3 opacity-80 text-black dark:text-white">
            {t?.schedule?.upNext || 'À suivre'}
          </div>
          {next ? (
            <div className="flex items-center gap-3">
              <img
                src={next.image}
                alt={next.title}
                className="h-16 w-16 rounded-xl object-cover border border-neutral-200 dark:border-white/10"
              />
              <div className="min-w-0">
                <div className="font-semibold truncate text-black dark:text-white">
                  {next.title}
                </div>
                <div className="text-sm opacity-80 text-black dark:text-white">
                  {fmtRange(next.start, next.end, lang)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70 text-black dark:text-white">—</div>
          )}
        </section>
      </div>

      {/* Cartes segments (style screenshot) */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3 text-black dark:text-white">
          {todayLabel} — {t?.schedule?.dailyRotation || 'Rotation 24 h'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((it) => (
            <article
              key={it.id}
              className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-900"
            >
              <img
                src={it.image}
                alt={it.title}
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute left-3 right-3 bottom-3">
                <div className="text-white font-extrabold tracking-wide uppercase drop-shadow">
                  {it.title}
                </div>
                <div className="text-white/90 text-xs font-semibold drop-shadow">
                  {fmtRange(it.start, it.end, lang)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Info autres chaînes */}
      <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#151515] p-4">
        <h2 className="text-sm font-semibold mb-2 text-black dark:text-white">
          {t?.nav?.channels || 'Chaînes spécialisées'}
        </h2>
        <p className="text-sm opacity-80 text-black dark:text-white">
          {t?.schedule?.otherAreRotation ||
            'Les autres chaînes spécialisées sont en rotation musicale 24/7.'}
        </p>
      </section>
    </div>
  );
}
