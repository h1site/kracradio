'use client';
// src/pages/About.jsx
import React, {useMemo, useEffect} from 'react';
import Seo from '../seo/Seo';
import {useI18n} from '../i18n';
import { aboutPageSchema, organizationSchema, breadcrumbSchema } from '../seo/schemas';

// ————————————————————————————————————————
// Contenu i18n local
// ————————————————————————————————————————
const STRINGS = {
  fr: {
    metaTitle: 'À propos de KracRadio — Notre histoire, mission et valeurs',
    metaDesc:
      "KracRadio : webradio indépendante basée à Montréal. Notre histoire, notre mission et nos valeurs. Écoutez, découvrez, partagez.",
    heroTitle: 'À propos de KracRadio',
    heroSubtitle:
      'Webradio indépendante, 100 % musique émergente et indie. Basée à Montréal. 24/7.',
    bannerText:
      "KracRadio évolue : nouvelles fonctionnalités, amélioration continue et programmation élargie.",
    missionTitle: 'Notre mission',
    missionBody:
      "Donner une voix aux artistes qui n’en ont pas dans les grands circuits, favoriser la découverte et la diversité, et rapprocher créateurs et auditeurs grâce à une diffusion accessible, continue et sans compromis.",
    historyTitle: 'Notre histoire',
    historyIntro:
      "Née d’une passion commune pour la musique et la culture, KracRadio a grandi avec sa communauté. De la première diffusion à la création de plusieurs chaînes thématiques, notre trajectoire reste la même : proposer une écoute libre, curieuse et ouverte.",
    channelsTitle: 'Des chaînes pour tous les goûts',
    channelsBody:
      'Electro • Rock • Jazz & Classique • Metal • Francophone • et plus encore — une programmation éclectique, toujours fidèle à l’esprit indie.',
    valuesTitle: 'Nos valeurs',
    values: [
      {
        title: 'Indépendance',
        body:
          "Aucune ligne éditoriale imposée par l’industrie : l’artistique d’abord.",
      },
      {
        title: 'Ouverture',
        body:
          'Diversité des genres, des scènes et des cultures musicales.',
      },
      {
        title: 'Communauté',
        body:
          'Une radio construite avec et pour ses auditeurs et artistes.',
      },
      {
        title: 'Innovation',
        body:
          'Expérimenter, améliorer l’expérience d’écoute, rester agile.',
      },
    ],
    timelineTitle: 'Repères',
    timeline: [
      {
        year: 'Origines',
        text:
          'Lancement de la diffusion 24/7 et affirmation de l’ADN 100 % indie.',
      },
      {
        year: 'Canaux',
        text:
          'Création de chaînes thématiques pour servir des communautés musicales variées.',
      },
      {
        year: 'Refonte',
        text:
          'Améliorations techniques : historique des titres, interface moderne, expérience fluide.',
      },
      {
        year: 'Relance',
        text:
          'Retour fort sur les réseaux et phase de croissance portée par la communauté.',
      },
    ],
    teamTitle: 'L’équipe',
    teamBody:
      "Derrière KracRadio : des passionnés de musique, de culture et de technologie.",
    teamList: [
      { role: 'Fondateur & direction de la station', name: 'Sébastien Ross' },
      { role: 'Programmation & opérations', name: 'Collaborateurs & bénévoles' },
      { role: 'Conseil & technique', name: 'Consultants' },
    ],
    ctaTitle: 'Écoutez, découvrez, partagez',
    ctaBody:
      "KracRadio est une expérience musicale vivante. Chaque jour, nous donnons une place aux artistes émergents et aux auditeurs curieux.",
    imageCreditsTitle: 'Crédits photos',
    imageCreditsIntro: 'Les images utilisées sur ce site proviennent de Unsplash. Merci aux photographes :',
  },
  en: {
    metaTitle: 'About KracRadio — Our Story, Mission, and Values',
    metaDesc:
      'KracRadio: an independent web radio based in Montreal. Our story, mission, and values. Listen, discover, share.',
    heroTitle: 'About KracRadio',
    heroSubtitle:
      'Independent web radio, 100% emerging & indie music. Based in Montreal. Streaming 24/7.',
    bannerText:
      'KracRadio is evolving: new features, ongoing improvements, and broader programming.',
    missionTitle: 'Our Mission',
    missionBody:
      'Give a voice to artists outside mainstream circuits, promote discovery and diversity, and bring creators and listeners closer through accessible, continuous, uncompromising broadcasting.',
    historyTitle: 'Our Story',
    historyIntro:
      'Born from a shared passion for music and culture, KracRadio has grown with its community. From the first streams to multiple thematic channels, our path remains the same: free, curious, and open listening.',
    channelsTitle: 'Channels for Every Taste',
    channelsBody:
      'Electro • Rock • Jazz & Classical • Metal • Francophone • and more — eclectic programming true to the indie spirit.',
    valuesTitle: 'Our Values',
    values: [
      { title: 'Independence', body: 'Editorial freedom: artistry first.' },
      { title: 'Openness', body: 'Diversity of genres, scenes, and cultures.' },
      { title: 'Community', body: 'Built with and for listeners & artists.' },
      {
        title: 'Innovation',
        body: 'Experiment, refine listening, stay agile.',
      },
    ],
    timelineTitle: 'Milestones',
    timeline: [
      {
        year: 'Origins',
        text:
          '24/7 streaming begins and a 100% indie DNA is set.',
      },
      {
        year: 'Channels',
        text:
          'Thematic channels launched to serve diverse music communities.',
      },
      {
        year: 'Refresh',
        text:
          'Technical upgrades: recent tracks, modern interface, smoother UX.',
      },
      {
        year: 'Relaunch',
        text:
          'Renewed social presence and growth phase led by the community.',
      },
    ],
    teamTitle: 'The Team',
    teamBody:
      'Behind KracRadio: music, culture, and tech enthusiasts.',
    teamList: [
      { role: 'Founder & Station Lead', name: 'Sébastien Ross' },
      { role: 'Programming & Operations', name: 'Contributors & Volunteers' },
      { role: 'Advisory & Engineering', name: 'Consultants' },
    ],
    ctaTitle: 'Listen, Discover, Share',
    ctaBody:
      'KracRadio is a living musical experience. Every day, we give space to emerging artists and curious listeners.',
    imageCreditsTitle: 'Photo Credits',
    imageCreditsIntro: 'Images used on this site are from Unsplash. Thanks to the photographers:',
  },
  es: {
    metaTitle: 'Acerca de KracRadio — Historia, Misión y Valores',
    metaDesc:
      'KracRadio: radio web independiente con sede en Montreal. Nuestra historia, misión y valores. Escuchar, descubrir, compartir.',
    heroTitle: 'Acerca de KracRadio',
    heroSubtitle:
      'Radio web independiente, 100 % música emergente e indie. Con sede en Montreal. 24/7.',
    bannerText:
      'KracRadio evoluciona: nuevas funciones, mejoras continuas y programación ampliada.',
    missionTitle: 'Nuestra misión',
    missionBody:
      'Dar voz a los artistas fuera de los circuitos principales, promover el descubrimiento y la diversidad, y acercar a creadores y oyentes mediante una emisión accesible, continua y sin concesiones.',
    historyTitle: 'Nuestra historia',
    historyIntro:
      'Nacida de una pasión compartida por la música y la cultura, KracRadio ha crecido con su comunidad. De las primeras emisiones a varios canales temáticos, nuestro camino sigue igual: escucha libre, curiosa y abierta.',
    channelsTitle: 'Canales para todos',
    channelsBody:
      'Electro • Rock • Jazz y Clásica • Metal • Francófono • y más — programación ecléctica fiel al espíritu indie.',
    valuesTitle: 'Nuestros valores',
    values: [
      { title: 'Independencia', body: 'Libertad editorial: el arte primero.' },
      { title: 'Apertura', body: 'Diversidad de géneros, escenas y culturas.' },
      { title: 'Comunidad', body: 'Hecha con y para oyentes y artistas.' },
      {
        title: 'Innovación',
        body: 'Experimentar, mejorar la escucha, mantener la agilidad.',
      },
    ],
    timelineTitle: 'Hitos',
    timeline: [
      {
        year: 'Orígenes',
        text:
          'Comienza la emisión 24/7 y se define un ADN 100 % indie.',
      },
      {
        year: 'Canales',
        text:
          'Lanzamiento de canales temáticos para servir a diversas comunidades musicales.',
      },
      {
        year: 'Renovación',
        text:
          'Mejoras técnicas: temas recientes, interfaz moderna, experiencia fluida.',
      },
      {
        year: 'Relanzamiento',
        text:
          'Regreso a redes y fase de crecimiento impulsada por la comunidad.',
      },
    ],
    teamTitle: 'El equipo',
    teamBody:
      'Detrás de KracRadio: amantes de la música, la cultura y la tecnología.',
    teamList: [
      { role: 'Fundador y dirección de la emisora', name: 'Sébastien Ross' },
      { role: 'Programación y operaciones', name: 'Colaboradores y voluntarios' },
      { role: 'Asesoría e ingeniería', name: 'Consultores' },
    ],
    ctaTitle: 'Escuchar, descubrir, compartir',
    ctaBody:
      'KracRadio es una experiencia musical viva. Cada día damos espacio a artistas emergentes y oyentes curiosos.',
    imageCreditsTitle: 'Créditos de fotos',
    imageCreditsIntro: 'Las imágenes de este sitio provienen de Unsplash. Gracias a los fotógrafos:',
  },
};

// Liste des crédits d'images Unsplash utilisées sur le site
const IMAGE_CREDITS = [
  { page: 'About', photographer: 'Wes Hicks', url: 'https://unsplash.com/@sickhews' },
  { page: 'Charts', photographer: 'Marcela Laskoski', url: 'https://unsplash.com/@marcelalaskoski' },
  { page: 'Contact', photographer: 'John Matychuk', url: 'https://unsplash.com/@john_matychuk' },
  { page: 'Articles', photographer: 'Caught In Joy', url: 'https://unsplash.com/@caughtinjoy' },
  { page: 'Schedule', photographer: 'Caught In Joy', url: 'https://unsplash.com/@caughtinjoy' },
  { page: 'Videos', photographer: 'Jakob Owens', url: 'https://unsplash.com/@jakobowens1' },
  { page: 'Artists', photographer: 'Austin Neill', url: 'https://unsplash.com/@arstyy' },
  { page: 'Feed', photographer: 'Austin Neill', url: 'https://unsplash.com/@arstyy' },
  { page: 'Spotify', photographer: 'Simon Noh', url: 'https://unsplash.com/@smnoh' },
  { page: 'Podcasts', photographer: 'Jonathan Velasquez', url: 'https://unsplash.com/@jonathanvelasquez' },
  { page: 'Community', photographer: 'Aditya Chinchure', url: 'https://unsplash.com/@adityachinchure' },
];

// ————————————————————————————————————————
// Utilitaires Head : favicon
// ————————————————————————————————————————
function FaviconLinks() {
  useEffect(() => {
    const ensure = (rel, href, sizes, type) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        if (sizes) el.setAttribute('sizes', sizes);
        if (type) el.setAttribute('type', type);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Remplacer ces chemins si besoin
    ensure('icon', '/favicon.ico');
    ensure('icon', '/favicon-32.png', '32x32', 'image/png');
    ensure('icon', '/favicon-192.png', '192x192', 'image/png');
    ensure('apple-touch-icon', '/apple-touch-icon.png', '180x180');
  }, []);
  return null;
}

// ————————————————————————————————————————
// Petits composants UI
// ————————————————————————————————————————
function Section({title, children}) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-black dark:text-white mb-4 uppercase">
          {title}
        </h2>
      )}
      <div className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-200">
        {children}
      </div>
    </section>
  );
}

function ValueCard({title, body, index}) {
  const gradients = [
    'from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800',
    'from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800',
    'from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800',
    'from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border-orange-200 dark:border-orange-800'
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${gradient} p-5 shadow-sm hover:shadow-md transition relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 dark:bg-white/5 rounded-full blur-2xl"></div>
      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true" role="img">
            <path d="M12 2l3 6 6 .9-4.5 4.2 1.1 6L12 16l-5.6 3.1 1.1-6L3 8.9 9 8l3-6z" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-black dark:text-white text-lg">{title}</h3>
          <p className="text-gray-700 dark:text-gray-300 mt-1">{body}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({year, text}) {
  return (
    <li className="relative pl-8 pb-4 last:pb-0">
      <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-white dark:border-gray-900" />
      {/* Ligne verticale */}
      <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-800 last:hidden" />
      <div className="bg-white/50 dark:bg-white/5 rounded-lg p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">{year}</p>
        <p className="text-sm text-blue-900 dark:text-blue-100">{text}</p>
      </div>
    </li>
  );
}

// Bandeau plein écran avec bande rouge à gauche + chevron et texte à côté
function NoticeBanner({text}) {
  return (
    <div className="w-full border-y border-gray-200 dark:border-gray-800">
      <div className="relative">
        {/* Bande rouge à gauche */}
        <div className="absolute inset-y-0 left-0 w-2 bg-red-600" aria-hidden="true" />
        <div className="flex items-center gap-3 pl-6 pr-4 sm:pl-8 sm:pr-6 py-4 bg-white dark:bg-gray-950">
          {/* Chevron */}
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 flex-none text-gray-900 dark:text-white"
            aria-hidden="true"
            role="img"
          >
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor" />
          </svg>
          {/* Texte à côté du chevron */}
          <p className="text-sm md:text-base text-gray-900 dark:text-gray-100">{text}</p>
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Page principale
// ————————————————————————————————————————
export default function About() {
  const {lang = 'fr'} = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);

  return (
    <main className="">
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/about"
        type="website"
        jsonLd={[
          aboutPageSchema,
          organizationSchema,
          breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: L.heroTitle }
          ])
        ]}
      />
      <FaviconLinks />

      {/* Hero avec image de fond */}
      <header className="relative -mx-8 -mt-8 mb-8 overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=300&fit=crop&auto=format&q=50"
            />
            <img
              src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1000&h=400&fit=crop&auto=format&q=60"
              alt="About KracRadio"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative pl-[60px] md:pl-[100px] pr-8 py-16 md:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl max-w-2xl">
            {L.heroTitle}
          </h1>
          <p className="mt-4 text-lg text-gray-200 max-w-xl">
            {L.heroSubtitle}
          </p>

          {/* Bannière info */}
          <div className="mt-6 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 max-w-2xl">
            <p className="text-sm text-white">{L.bannerText}</p>
          </div>
        </div>
      </header>

      <div className="container-max pr-[30px] pl-[20px]">

      {/* Mission */}
      <Section title={L.missionTitle}>
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/50 dark:to-pink-950/50 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 dark:bg-purple-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-purple-900 dark:text-purple-100 leading-relaxed">{L.missionBody}</p>
          </div>
        </div>
      </Section>

      {/* Histoire */}
      <Section title={L.historyTitle}>
        <p className="mb-6">{L.historyIntro}</p>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-800 dark:from-blue-950/50 dark:to-cyan-950/50 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {L.timelineTitle}
            </h3>
            <ol className="space-y-4">
              {L.timeline.map((it, idx) => (
                <TimelineItem key={idx} year={it.year} text={it.text} />
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* Chaînes */}
      <Section title={L.channelsTitle}>
        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/50 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-400/5 rounded-full blur-3xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-600 dark:bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-green-900 dark:text-green-100 leading-relaxed">{L.channelsBody}</p>
          </div>
        </div>
      </Section>

      {/* Valeurs */}
      <Section title={L.valuesTitle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {L.values.map((v, i) => (
            <ValueCard key={i} title={v.title} body={v.body} index={i} />
          ))}
        </div>
      </Section>

      {/* Équipe */}
      <Section title={L.teamTitle}>
        <p className="mb-4">{L.teamBody}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {L.teamList.map((m, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/50 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{m.name}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{m.role}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-8 text-center shadow-sm dark:border-red-800 dark:from-red-950/50 dark:to-orange-950/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 dark:bg-red-400/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-red-900 dark:text-red-100">{L.ctaTitle}</h3>
            <p className="text-red-800 dark:text-red-200">{L.ctaBody}</p>
          </div>
        </div>
      </Section>

      {/* Image Credits */}
      <Section title={L.imageCreditsTitle}>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{L.imageCreditsIntro}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {IMAGE_CREDITS.map((credit, idx) => (
              <a
                key={idx}
                href={credit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {credit.photographer.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {credit.photographer}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{credit.page}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
              Unsplash
            </a>
            {' '}— {lang === 'fr' ? 'Photos libres de droits' : lang === 'es' ? 'Fotos libres de derechos' : 'Royalty-free photos'}
          </p>
        </div>
      </Section>
      </div>
    </main>
  );
}
