// src/pages/Home.jsx
import React, { useMemo } from 'react';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import ChannelCarousel from '../components/ChannelCarousel';
import daily from '../data/daily-schedule.json';

const KRAC_KEY = 'kracradio';

function toTodayDate(timeStr) {
  const [hhRaw, mmRaw] = (timeStr || '00:00').split(':');
  const hh = parseInt(hhRaw, 10);
  const mm = parseInt(mmRaw, 10);
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (hh >= 24) {
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

export default function Home() {
  const { t, lang } = useI18n();

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';

  const segments = useMemo(() => {
    const arr = (daily || []).map((it, idx) => {
      const start = toTodayDate(it.start);
      const end = toTodayDate(it.end);
      return {
        id: `${start.toISOString()}-${idx}`,
        title: (it.title || '').trim(),
        start,
        end,
        image: it.image || kracImage
      };
    }).sort((a, b) => a.start - b.start);
    return arr;
  }, [kracImage]);

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

      {/* HERO funky: full width, bg noir jusqu’au bouton */}
      <section className="w-full pt-14 px-0 bg-[#000] pb-5">
        <h2 className="px-5 text-xl font-semibold text-white mb-3 uppercase">
          {t.home?.nowOnKrac || 'Présentement sur KracRadio'}
        </h2>

        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-neutral-800">
            {/* En lecture */}
            <div
              className="relative h-64 lg:h-80"
              style={{
                backgroundImage: `url(${current?.image || kracImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute left-5 right-5 bottom-5">
                <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80 mb-2">
                  {t?.site?.nowPlaying || 'En lecture'}
                </div>
                <div className="text-white text-2xl font-extrabold leading-tight drop-shadow">
                  {current?.title || '—'}
                </div>
                <div className="text-white/90 text-sm font-medium mt-1">
                  {current ? fmtRange(current.start, current.end, lang) : '—'}
                </div>
              </div>
            </div>

            {/* À suivre */}
            <div
              className="relative h-64 lg:h-80"
              style={{
                backgroundImage: `url(${next?.image || kracImage})`,
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
                  {next?.title || '—'}
                </div>
                <div className="text-white/90 text-sm font-medium mt-1">
                  {next ? fmtRange(next.start, next.end, lang) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* CTA en bas à droite */}
          <div className="flex justify-end">
            <a
              href="/schedule"
              className="mt-3 mr-5 inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold border border-neutral-700 bg-white/5 text-white hover:bg-white/10 transition"
            >
              {t.home?.viewScheduleCta || 'Consulter notre horaire'}
            </a>
          </div>
        </div>
      </section>

      {/* Carrousel des chaînes */}
      <section className="w-full">
        <div className="px-5 pt-10">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3 uppercase">
            {t.home?.channelsHeading}
          </h2>
        </div>
        <ChannelCarousel channels={channels} />
      </section>
    </div>
  );
}
