// src/pages/About.jsx
import React, {useMemo, useEffect} from 'react';
import Seo from '../seo/Seo';
import {useI18n} from '../i18n';

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
  },
};

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

function ValueCard({title, body}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-3">
        {/* Icône simple en SVG inline (étoile) */}
        <svg viewBox="0 0 24 24" className="w-6 h-6 flex-none" aria-hidden="true" role="img">
          <path d="M12 2l3 6 6 .9-4.5 4.2 1.1 6L12 16l-5.6 3.1 1.1-6L3 8.9 9 8l3-6z" fill="currentColor" />
        </svg>
        <div>
          <h3 className="font-semibold text-black dark:text-white">{title}</h3>
          <p className="text-gray-700 dark:text-gray-300 mt-1">{body}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({year, text}) {
  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-1.5 inline-block w-3 h-3 rounded-full bg-gray-900 dark:bg-white" />
      <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{year}</p>
      <p className="text-gray-800 dark:text-gray-100">{text}</p>
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
    <main className="container-max pr-[30px]">
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/about"
        type="website"
      />
      <FaviconLinks />

      <header className="pb-12">
        <span className="inline-flex items-center rounded-full border border-red-600/40 bg-red-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          À propos
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
          {L.heroTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-gray-700 dark:text-gray-300 md:text-lg">
          {L.heroSubtitle}
        </p>

        {/* Bannière info */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-sm text-gray-700 dark:text-gray-300">{L.bannerText}</p>
        </div>
      </header>

      {/* Mission */}
      <Section title={L.missionTitle}>
        <p>{L.missionBody}</p>
      </Section>

      {/* Histoire */}
      <Section title={L.historyTitle}>
        <p className="mb-6">{L.historyIntro}</p>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">{L.timelineTitle}</h3>
          <ol className="space-y-4">
            {L.timeline.map((it, idx) => (
              <TimelineItem key={idx} year={it.year} text={it.text} />
            ))}
          </ol>
        </div>
      </Section>

      {/* Chaînes */}
      <Section title={L.channelsTitle}>
        <p>{L.channelsBody}</p>
      </Section>

      {/* Valeurs */}
      <Section title={L.valuesTitle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {L.values.map((v, i) => (
            <ValueCard key={i} title={v.title} body={v.body} />
          ))}
        </div>
      </Section>

      {/* Équipe */}
      <Section title={L.teamTitle}>
        <p className="mb-4">{L.teamBody}</p>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          {L.teamList.map((m, i) => (
            <li key={i} className="p-4 flex items-center justify-between">
              <span className="text-gray-800 dark:text-gray-100 font-medium">{m.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{m.role}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* CTA */}
      <Section>
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-black dark:text-white">{L.ctaTitle}</h3>
          <p className="text-gray-700 dark:text-gray-300">{L.ctaBody}</p>
        </div>
      </Section>
    </main>
  );
}
