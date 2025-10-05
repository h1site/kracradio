// src/pages/Home.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import ChannelCarousel from '../components/ChannelCarousel';
import daily from '../data/daily-schedule.json';
import { useAudio } from '../context/AudioPlayerContext';
import { supabase } from '../lib/supabase';

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
  const [recentPosts, setRecentPosts] = useState([]);
  const [latestBlog, setLatestBlog] = useState(null);
  const [latestPodcast, setLatestPodcast] = useState(null);

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';

  // Charger les 3 derniers posts
  useEffect(() => {
    const loadRecentPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .is('deleted_at', null)
        .is('reply_to_id', null)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, artist_slug, avatar_url, is_verified')
          .in('id', userIds);

        const profilesMap = {};
        if (profiles) {
          profiles.forEach(p => { profilesMap[p.id] = p; });
        }

        setRecentPosts(data.map(post => ({
          ...post,
          author: profilesMap[post.user_id] || null
        })));
      }
    };

    loadRecentPosts();
  }, []);

  // Charger le dernier blog
  useEffect(() => {
    const loadLatestBlog = async () => {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setLatestBlog(data);
    };

    loadLatestBlog();
  }, []);

  // Charger un podcast aléatoire
  useEffect(() => {
    const loadRandomPodcast = async () => {
      // D'abord, compter le nombre total de podcasts
      const { count } = await supabase
        .from('user_podcasts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (count && count > 0) {
        // Générer un offset aléatoire
        const randomOffset = Math.floor(Math.random() * count);

        // Récupérer le podcast à cet offset
        const { data } = await supabase
          .from('user_podcasts')
          .select('*')
          .eq('is_active', true)
          .range(randomOffset, randomOffset)
          .single();

        if (data) setLatestPodcast(data);
      }
    };

    loadRandomPodcast();
  }, []);

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
    <div className="-mt-5">
      <Seo
        lang={lang}
        title={t.meta?.homeTitle}
        description={t.meta?.homeDesc}
        path="/"
        type="website"
        alternates
      />

      {/* HERO */}
      <section className="w-full px-0 pb-0">
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
        <div className="px-5 md:px-5 px-0 pt-0">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3 pt-5 uppercase px-5 md:px-0">
            {t.home?.channelsHeading}
          </h2>
        </div>
        <div className="overflow-visible">
          <ChannelCarousel channels={channels} />
        </div>
      </section>

      {/* Section Features + 3 derniers posts */}
      <section className="px-5 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bloc 1 - Features & Bénéfices */}
          <div className="bg-bg-secondary rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">
                Rejoignez la communauté
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎵</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Partagez votre musique</h3>
                  <p className="text-sm text-text-secondary">Diffusez vos créations et connectez-vous avec des fans</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎙️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Créez votre podcast</h3>
                  <p className="text-sm text-text-secondary">Lancez votre émission et développez votre audience</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✍️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Publiez vos articles</h3>
                  <p className="text-sm text-text-secondary">Partagez vos idées et histoires avec la communauté</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Interagissez en temps réel</h3>
                  <p className="text-sm text-text-secondary">Commentez, aimez et suivez vos artistes préférés</p>
                </div>
              </div>
            </div>
            <Link
              to="/auth/signup"
              className="mt-6 inline-block w-full text-center px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-colors"
            >
              Créer un compte gratuitement
            </Link>
          </div>

          {/* Bloc 2 - 3 derniers posts */}
          <div className="bg-bg-secondary rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Derniers posts</h2>
            </div>
            <div className="space-y-4">
              {recentPosts.length === 0 ? (
                <p className="text-text-secondary text-center py-8">Aucun post pour le moment</p>
              ) : (
                recentPosts.map(post => (
                  <div key={post.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      {post.author?.avatar_url ? (
                        <img src={post.author.avatar_url} alt={post.author.username} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                          {post.author?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <Link
                        to={post.author?.artist_slug ? `/profile/${post.author.artist_slug}` : `/profile/${post.user_id}`}
                        className="font-semibold text-text-primary hover:text-accent transition-colors"
                      >
                        {post.author?.username || 'Utilisateur'}
                      </Link>
                    </div>
                    <p className="text-text-primary text-sm line-clamp-2">{post.content}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/dashboard"
              className="mt-6 inline-block w-full text-center px-6 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors"
            >
              Voir tous les posts
            </Link>
          </div>
        </div>
      </section>

      {/* Section Blog + Podcast */}
      <section className="px-5 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bloc 1 - Dernier blog */}
          <div className="bg-bg-secondary rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Dernier article</h2>
            </div>
            {latestBlog ? (
              <>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{latestBlog.title}</h3>
                <p className="text-text-secondary mb-4 line-clamp-3">{latestBlog.content?.substring(0, 200)}...</p>
                <div className="flex gap-4">
                  <Link
                    to={`/article/${latestBlog.slug}`}
                    className="flex-1 text-center px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Lire l'article
                  </Link>
                  <Link
                    to="/blog"
                    className="flex-1 text-center px-6 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors"
                  >
                    Tous les blogs
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-text-secondary text-center py-8">Aucun article pour le moment</p>
            )}
          </div>

          {/* Bloc 2 - Podcast aléatoire */}
          <div className="bg-bg-secondary rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2a9 9 0 0 0-9 9v7.5A2.5 2.5 0 0 0 5.5 21h1a2.5 2.5 0 0 0 2.5-2.5V15a2.5 2.5 0 0 0-2.5-2.5h-.5v-1A7 7 0 0 1 19 11.5v1h-.5A2.5 2.5 0 0 0 16 15v3.5a2.5 2.5 0 0 0 2.5 2.5h1a2.5 2.5 0 0 0 2.5-2.5V11a9 9 0 0 0-9-9z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Podcast du jour</h2>
            </div>
            {latestPodcast ? (
              <>
                {latestPodcast.image_url && (
                  <img src={latestPodcast.image_url} alt={latestPodcast.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                <h3 className="text-xl font-semibold text-text-primary mb-2">{latestPodcast.title}</h3>
                {latestPodcast.author && (
                  <p className="text-sm text-text-secondary mb-3">Par {latestPodcast.author}</p>
                )}
                <p className="text-text-secondary mb-4 line-clamp-3">{latestPodcast.description}</p>
                <div className="flex gap-4">
                  <a
                    href={latestPodcast.website_url || latestPodcast.rss_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Découvrir
                  </a>
                  <Link
                    to="/podcasts"
                    className="flex-1 text-center px-6 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors"
                  >
                    Tous les podcasts
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-text-secondary text-center py-8">Aucun podcast pour le moment</p>
            )}
          </div>
        </div>
      </section>

      {/* Cale mobile pour le player fixe */}
      <div
        className="sm:hidden"
        style={{ height: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}
      />
    </div>
  );
}
