// src/pages/Schedule.jsx
import React, { useMemo } from 'react';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import daily from '../data/daily-schedule.json';
import { useAudio } from '../context/AudioPlayerContext';

const KRAC_KEY = 'kracradio';

function toTodayDate(timeStr) {
  const [hhRaw, mmRaw] = (timeStr || '00:00').split(':');
  const hh = parseInt(hhRaw, 10);
  const mm = parseInt(mmRaw, 10) || 0;
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (Number.isFinite(hh) && hh >= 24) {
    d.setDate(d.getDate() + 1);
    d.setHours(0, mm, 0, 0);
  } else {
    d.setHours(Number.isFinite(hh) ? hh : 0, mm, 0, 0);
  }
  return d;
}

function fmtRange(start, end, lang) {
  const opt = { hour: '2-digit', minute: '2-digit' };
  return `${new Intl.DateTimeFormat(lang, opt).format(start)} — ${new Intl.DateTimeFormat(lang, opt).format(end)}`;
}

export default function Schedule() {
  const { lang, t } = useI18n();
  const { current, playing, playChannel, togglePlay } = useAudio();

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';

  // Segments de la journée
  const segments = useMemo(() => {
    const arr = (daily || [])
      .map((it, idx) => {
        const start = toTodayDate(it.start);
        const end = toTodayDate(it.end);
        return {
          id: `${start.toISOString()}-${idx}`,
          title: (it.title || '').trim(),
          start,
          end,
          image: it.image || kracImage
        };
      })
      .sort((a, b) => a.start - b.start);
    return arr;
  }, [kracImage]);

  // Now & Next (mêmes règles que Home)
  const { currentSeg, nextSeg } = useMemo(() => {
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
    return { currentSeg: cur, nextSeg: nxt };
  }, [segments]);

  const isKracPlaying = playing && current?.key === KRAC_KEY;

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date());
  }, [lang]);

  return (
    <div className="page-scroll pl-14 pr-2 pt-0">
      {/* === SECTION IDENTIQUE À HOME : Now Playing + À suivre === */}
      <section className="w-full px-0 bg-[#] pb-0">
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-b-2xl overflow-hidden border border-neutral-800">
            {/* Bloc 1 — En lecture (Now Playing) */}
            <div
              className="group relative h-64 lg:h-80"
              style={{
                backgroundImage: `url(${currentSeg?.image || kracImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute left-5 right-5 top-4 flex items-center gap-2">
                <div className="text-white text-2xl font-extrabold leading-tight drop-shadow uppercase">
                  {t.home?.nowOnKrac || 'Présentement sur KracRadio'}
                </div>
              </div>

              <div className="absolute left-5 right-5 bottom-5">
                <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80 mb-2">
                  {t?.site?.nowPlaying || 'En lecture'}
                </div>
                <div className="text-white text-2xl font-extrabold leading-tight drop-shadow">
                  {currentSeg?.title || '—'}
                </div>
                <div className="text-white/90 text-sm font-medium mt-1">
                  {currentSeg ? fmtRange(currentSeg.start, currentSeg.end, lang) : '—'}
                </div>
              </div>

              {/* Bouton Écouter (même logique que Home) */}
              <div className="absolute right-5 bottom-5">
                <button
                  type="button"
                  aria-label={t.home?.listenCta || 'Écouter'}
                  aria-pressed={isKracPlaying}
                  className="transition duration-200 focus:outline-none"
                  onClick={() =>
                    (current?.key === KRAC_KEY ? togglePlay() : playChannel(KRAC_KEY))
                  }
                >
                  <span className="inline-flex items-center rounded-full border border-white/30 bg-black/70 backdrop-blur px-3 pr-4 py-2 text-white shadow-sm hover:bg-black/80 hover:border-white/50 focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black">
                    <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600">
                      {isKracPlaying ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                          <rect x="6" y="5" width="4" height="14" rx="1" />
                          <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm font-semibold">
                      {t.home?.listenCta || 'Écouter'}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Bloc 2 — À suivre (Up next) */}
            <div
              className="relative h-64 lg:h-80"
              style={{
                backgroundImage: `url(${nextSeg?.image || kracImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute left-5 right-5 bottom-5">
                <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80 mb-2">
                  {t?.schedule?.upNext || 'À suivre'}
                </div>
                <div className="text-white text-2xl font-extrabold leading-tight drop-shadow">
                  {nextSeg?.title || '—'}
                </div>
                <div className="text-white/90 text-sm font-medium mt-1 mb-3">
                  {nextSeg ? fmtRange(nextSeg.start, nextSeg.end, lang) : '—'}
                </div>

                {/* ⬇️ CTA retiré comme demandé */}
                {/* <div className="w-full flex justify-end">
                  <a ...>{t.home?.viewScheduleCta}</a>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </section>

{/* === PHOTO + TEXTE (sans arrondis, gauche flat) === */}
<div className="mb-6 pt-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 items-left">
    {/* Bloc 1 : photo de la station — FLAT (aucun bg/border) */}
    <div className="p-4 sm:p-0 flex items-center justify-left bg-transparent">
      
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black dark:text-white uppercase">
        
      
       <span className="mt-2 inline-block text-[11px] sm:text-xs px-2 py-1 bg-black/90 text-white dark:bg-white/90 dark:text-black font-semibold uppercase">
        {t?.nav?.schedule || 'Horaire'} — 24 h 
      </span> </h1>
    </div>
  </div>
</div>



      {/* === Capsules de l’horaire (grid) === */}
      <section className="mb-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((it) => (
            <article
              key={it.id}
              className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-900"
            >
              <img
                src={it.image}
                alt={it.title || '—'}
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute left-3 right-3 bottom-3">
                <div className="text-white font-extrabold tracking-wide uppercase drop-shadow">
                  {it.title || '—'}
                </div>
                <div className="text-white/90 text-xs font-semibold drop-shadow">
                  {fmtRange(it.start, it.end, lang)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Espace bas pour un player fixe */}
      <div className="pb-14" aria-hidden="true" />
    </div>
  );
}
