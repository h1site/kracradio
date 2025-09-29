// src/pages/Channel.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getChannelByKey } from '../data/channels';
import { useAudio } from '../context/AudioPlayerContext';
import { getHistory, getNowPlaying } from '../utils/azura';
import { useI18n } from '../i18n';

export default function ChannelPage() {
  const { key } = useParams();
  const channel = getChannelByKey(key);
  const { t } = useI18n();
  const { playStream } = useAudio();
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!channel) return;
    (async () => {
      try { setMeta(await getNowPlaying(channel.apiUrl)); } catch {}
      try { setHistory(await getHistory(channel.apiUrl, 10)); } catch {}
    })();
  }, [channel]);

  if (!channel) return <main className="container-max py-8">Channel not found.</main>;

  return (
    <main className="container-max py-8">
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Image portrait de la chaîne */}
        <div className="rounded-2xl overflow-hidden border border-neutral-800">
          <img
            src={channel.image || '/channels/default.webp'}
            alt={channel.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Infos */}
        <div className="space-y-5">
          <h1 className="text-3xl font-bold">{channel.name}</h1>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="text-sm uppercase text-white/70">{t.site.nowPlaying}</div>
            <div className="mt-1 font-semibold">{meta?.title || '—'}</div>
            <div className="text-sm text-white/70">{meta?.artist || '—'}</div>
            <div className="mt-3">
              <button className="btn-primary" onClick={() => playStream(channel)}>
                {t.site.tuneIn}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">{t.site.lastTracks}</h2>
            <ul className="space-y-2">
              {history.map((h, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-700 overflow-hidden">
                    {h.art && <img src={h.art} alt="art" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{h.title}</div>
                    <div className="text-sm text-white/70 truncate">{h.artist}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </main>
  );
}
