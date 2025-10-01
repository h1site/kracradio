// src/pages/Home.jsx
import React, { useMemo } from 'react';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import ChannelCarousel from '../components/ChannelCarousel';
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

export default function Home() {
  const { t, lang } = useI18n();
  const { current, playing, playChannel, togglePlay } = useAudio();

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';

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

  return (
    <div className="page-scroll">
      <Seo
        lang={lang}
        title={t.meta?.homeTitle}
        description={t.meta?.homeDesc}
        path="/"
        type="website"
        alternates
      />

      {/* HERO */}
      <section className="w-full px-0 bg-[#000] pb-0">
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-b-2xl overflow-hidden border border-neutral-800">
            {/* Bloc 1 — En lecture */}
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

              {/* BOUTON ÉCOUTER */}
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

            {/* Bloc 2 — À suivre */}
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

                <div className="w-full flex justify-end">
                  <a
                    href="/schedule"
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-semibold border border-red-700/60 bg-red-600 hover:bg-red-700 text-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:ring-offset-2 focus:ring-offset-black transition"
                  >
                    {t.home?.viewScheduleCta || 'Consulter notre horaire'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* pas d’espace sous le hero */}
        </div>
      </section>

      {/* Carrousel */}
      <section className="w-full relative z-10 overflow-visible">
        <div className="px-5 pt-0">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3 pt-5 uppercase">
            {t.home?.channelsHeading}
          </h2>
        </div>
        <div className="overflow-visible">
          <ChannelCarousel channels={channels} />
        </div>
      </section>

      {/* Cale mobile pour le player fixe */}
      <div
        className="sm:hidden"
        style={{ height: 'calc(1200px + env(safe-area-inset-bottom, 0px))' }}
      />
    </div>
  );
}
