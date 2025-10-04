import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';

const STRINGS = {
  fr: {
    metaTitle: 'Podcasts KracRadio — Découvrez nos podcasts indépendants',
    metaDesc:
      'Écoutez des podcasts indépendants sur KracRadio. Une sélection variée de contenus audio originaux.',
    heroBadge: 'Podcasts',
    heroTitle: 'Découvrez nos podcasts',
    heroSubtitle:
      'Une sélection de podcasts indépendants, variés et passionnants.',
    managePodcasts: 'Gérer mes podcasts',
    infoTitle: 'Pourquoi enregistrer votre podcast ?',
    infoBody:
      'Nous construisons un répertoire de podcasts indépendants. Envoyez-nous vos informations pour que notre équipe puisse programmer, promouvoir et discuter de collaborations possibles.',
    guidelinesTitle: 'Avant de soumettre',
    guidelines: [
      'Le flux RSS doit être accessible publiquement (HTTP ou HTTPS).',
      'Indiquez une adresse courriel valide : nous vous contacterons pour la suite.',
      'Vous pouvez ajouter plusieurs podcasts lors d’une même soumission.',
    ],
    form: {
      sectionTitle: 'Formulaire d’inscription',
      sectionSubtitle: 'Renseignez vos informations et vos flux RSS.',
      contactTitle: 'Coordonnées principales',
      nameLabel: 'Nom complet',
      namePlaceholder: 'Votre nom et prénom',
      emailLabel: 'Courriel',
      emailPlaceholder: 'vous@example.com',
      orgLabel: 'Organisation ou projet (optionnel)',
      orgPlaceholder: 'Collectif, label, média…',
      podcastsTitle: 'Podcasts à indexer',
      podcastTitleLabel: 'Titre du podcast',
      podcastTitlePlaceholder: 'Nom du podcast',
      podcastFeedLabel: 'Flux RSS',
      podcastFeedPlaceholder: 'https://votre-podcast.com/feed.xml',
      addPodcast: 'Ajouter un podcast',
      removePodcast: 'Retirer',
      submit: 'Soumettre ma demande',
      localOnly: 'Les demandes sont stockées localement pour cette démonstration.',
    },
    successTitle: 'Demande enregistrée',
    successBody: 'Merci ! Nous vous contacterons rapidement pour finaliser l’intégration de vos podcasts.',
    summaryTitle: 'Aperçu de vos demandes (session)',
    summaryContact: 'Contact',
    summaryPodcasts: 'Podcasts soumis',
    summaryEmpty: 'Aucune demande enregistrée pour le moment.',
    errors: {
      nameRequired: 'Le nom est requis.',
      emailRequired: 'Le courriel est requis.',
      emailInvalid: 'Le courriel semble invalide.',
      titleRequired: 'Le titre du podcast est requis.',
      rssRequired: 'Le flux RSS est requis.',
      rssInvalid: 'Le flux RSS doit être une URL valide.',
    },
  },
  en: {
    metaTitle: 'KracRadio Podcasts — Submit Your RSS Feed',
    metaDesc:
      'Submit your independent podcast to KracRadio. Share your title, RSS feed, and contact details so we can follow up.',
    heroBadge: 'Podcasts',
    heroTitle: 'Register Your Podcast with KracRadio',
    heroSubtitle:
      'Tell us about your show, share the RSS feed, and join our independent programming.',
    infoTitle: 'Why register your podcast?',
    infoBody:
      'We are building a directory of independent podcasts. Send your details so our team can schedule, promote, and explore collaborations.',
    guidelinesTitle: 'Before you submit',
    guidelines: [
      'Your RSS feed must be publicly reachable over HTTP or HTTPS.',
      'Provide a valid email address so we can get back to you.',
      'You can register several podcasts in the same submission.',
    ],
    form: {
      sectionTitle: 'Registration form',
      sectionSubtitle: 'Fill in your details and RSS feeds.',
      contactTitle: 'Primary contact',
      nameLabel: 'Full name',
      namePlaceholder: 'Your first and last name',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      orgLabel: 'Organization or project (optional)',
      orgPlaceholder: 'Collective, label, media…',
      podcastsTitle: 'Podcasts to list',
      podcastTitleLabel: 'Podcast title',
      podcastTitlePlaceholder: 'Name of the podcast',
      podcastFeedLabel: 'RSS feed',
      podcastFeedPlaceholder: 'https://your-podcast.com/feed.xml',
      addPodcast: 'Add a podcast',
      removePodcast: 'Remove',
      submit: 'Submit my request',
      localOnly: 'Submissions are stored locally for this demo.',
    },
    successTitle: 'Request received',
    successBody: 'Thank you! We will reach out shortly to complete your podcast onboarding.',
    summaryTitle: 'Submission overview (this session)',
    summaryContact: 'Contact',
    summaryPodcasts: 'Submitted podcasts',
    summaryEmpty: 'No submissions recorded yet.',
    errors: {
      nameRequired: 'Name is required.',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      titleRequired: 'Podcast title is required.',
      rssRequired: 'RSS feed is required.',
      rssInvalid: 'The RSS feed must be a valid URL.',
    },
  },
  es: {
    metaTitle: 'KracRadio Podcasts — Registra tu feed RSS',
    metaDesc:
      'Envía tu podcast independiente a KracRadio. Comparte el título, el feed RSS y tus datos de contacto para continuar el proceso.',
    heroBadge: 'Podcasts',
    heroTitle: 'Registra tu podcast en KracRadio',
    heroSubtitle:
      'Cuéntanos sobre tu programa, comparte el feed RSS y únete a nuestra programación independiente.',
    infoTitle: '¿Por qué registrar tu podcast?',
    infoBody:
      'Estamos creando un directorio de podcasts independientes. Envíanos tus datos para que el equipo pueda programar, promocionar y explorar colaboraciones.',
    guidelinesTitle: 'Antes de enviar',
    guidelines: [
      'El feed RSS debe estar disponible públicamente (HTTP o HTTPS).',
      'Incluye un correo electrónico válido para ponernos en contacto.',
      'Puedes agregar varios podcasts en una misma solicitud.',
    ],
    form: {
      sectionTitle: 'Formulario de registro',
      sectionSubtitle: 'Completa tus datos y feeds RSS.',
      contactTitle: 'Contacto principal',
      nameLabel: 'Nombre completo',
      namePlaceholder: 'Tu nombre y apellido',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@ejemplo.com',
      orgLabel: 'Organización o proyecto (opcional)',
      orgPlaceholder: 'Colectivo, sello, medio…',
      podcastsTitle: 'Podcasts a incluir',
      podcastTitleLabel: 'Título del podcast',
      podcastTitlePlaceholder: 'Nombre del podcast',
      podcastFeedLabel: 'Feed RSS',
      podcastFeedPlaceholder: 'https://tu-podcast.com/feed.xml',
      addPodcast: 'Agregar un podcast',
      removePodcast: 'Eliminar',
      submit: 'Enviar mi solicitud',
      localOnly: 'Las solicitudes se guardan localmente en esta demostración.',
    },
    successTitle: 'Solicitud recibida',
    successBody: '¡Gracias! Nos pondremos en contacto pronto para finalizar la integración de tus podcasts.',
    summaryTitle: 'Resumen de tus solicitudes (sesión)',
    summaryContact: 'Contacto',
    summaryPodcasts: 'Podcasts enviados',
    summaryEmpty: 'Aún no hay solicitudes registradas.',
    errors: {
      nameRequired: 'El nombre es obligatorio.',
      emailRequired: 'El correo electrónico es obligatorio.',
      emailInvalid: 'Introduce un correo electrónico válido.',
      titleRequired: 'El título del podcast es obligatorio.',
      rssRequired: 'El feed RSS es obligatorio.',
      rssInvalid: 'El feed RSS debe ser una URL válida.',
    },
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blankPodcast = {title: '', rss: ''};

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

export default function Podcasts() {
  const {lang} = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const [contact, setContact] = useState({name: '', email: '', organization: ''});
  const [podcasts, setPodcasts] = useState([{...blankPodcast}]);
  const [errors, setErrors] = useState({contact: {}, podcasts: []});
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('idle');

  const handleContactChange = (field, value) => {
    setContact(prev => ({...prev, [field]: value}));
    setErrors(prev => ({
      contact: {...prev.contact, [field]: ''},
      podcasts: prev.podcasts,
    }));
    setStatus('editing');
  };

  const handlePodcastChange = (index, field, value) => {
    setPodcasts(prev => {
      const next = prev.map((item, i) => (i === index ? {...item, [field]: value} : item));
      return next;
    });
    setErrors(prev => {
      const nextPodcastErrors = prev.podcasts.slice();
      if (!nextPodcastErrors[index]) nextPodcastErrors[index] = {};
      nextPodcastErrors[index] = {...nextPodcastErrors[index], [field]: ''};
      return {contact: prev.contact, podcasts: nextPodcastErrors};
    });
    setStatus('editing');
  };

  const addPodcast = () => {
    setPodcasts(prev => [...prev, {...blankPodcast}]);
    setErrors(prev => ({contact: prev.contact, podcasts: [...prev.podcasts, {}]}));
    setStatus('editing');
  };

  const removePodcast = index => {
    setPodcasts(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => ({
      contact: prev.contact,
      podcasts: prev.podcasts.filter((_, i) => i !== index),
    }));
    setStatus('editing');
  };

  const validate = () => {
    let valid = true;
    const contactErrors = {};
    const podcastErrors = podcasts.map(() => ({}));

    if (!contact.name.trim()) {
      contactErrors.name = L.errors.nameRequired;
      valid = false;
    }

    const emailValue = contact.email.trim();
    if (!emailValue) {
      contactErrors.email = L.errors.emailRequired;
      valid = false;
    } else if (!EMAIL_REGEX.test(emailValue)) {
      contactErrors.email = L.errors.emailInvalid;
      valid = false;
    }

    podcasts.forEach((podcast, index) => {
      if (!podcast.title.trim()) {
        podcastErrors[index].title = L.errors.titleRequired;
        valid = false;
      }
      const rssValue = podcast.rss.trim();
      if (!rssValue) {
        podcastErrors[index].rss = L.errors.rssRequired;
        valid = false;
      } else if (!isValidUrl(rssValue)) {
        podcastErrors[index].rss = L.errors.rssInvalid;
        valid = false;
      }
    });

    setErrors({contact: contactErrors, podcasts: podcastErrors});
    return valid;
  };

  const handleSubmit = event => {
    event.preventDefault();
    if (!validate()) return;

    const submission = {
      id: Date.now(),
      contact: {
        name: contact.name.trim(),
        email: contact.email.trim(),
        organization: contact.organization.trim(),
      },
      podcasts: podcasts.map(item => ({
        title: item.title.trim(),
        rss: item.rss.trim(),
      })),
      submittedAt: new Date().toISOString(),
    };

    setSubmissions(prev => [submission, ...prev]);
    setContact({name: '', email: '', organization: ''});
    setPodcasts([{...blankPodcast}]);
    setErrors({contact: {}, podcasts: []});
    setStatus('success');
  };

  return (
    <main className="container-max">
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/podcasts"
        type="website"
      />

      <header className="pt-0 pb-12">
        <span className="inline-flex items-center rounded-full border border-red-600/40 bg-red-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          {L.heroBadge}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
          {L.heroTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-gray-700 dark:text-gray-300 md:text-lg">
          {L.heroSubtitle}
        </p>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-800 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 md:text-base">
        <h2 className="text-xl font-semibold text-black dark:text-white">{L.infoTitle}</h2>
        <p className="mt-3 opacity-90">{L.infoBody}</p>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="text-lg font-semibold text-black dark:text-white">{L.guidelinesTitle}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 md:text-base">
            {L.guidelines.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-red-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-black dark:text-white">{L.form.sectionTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{L.form.sectionSubtitle}</p>
          </div>

          {status === 'success' && (
            <div className="mt-6 rounded-2xl border border-green-500/40 bg-green-50 p-4 text-sm text-green-800 shadow-sm dark:border-green-600/40 dark:bg-green-900/20 dark:text-green-100">
              <p className="font-semibold">{L.successTitle}</p>
              <p className="mt-1 text-sm opacity-90">{L.successBody}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-black dark:text-white">{L.form.contactTitle}</legend>

              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.form.nameLabel}
                </label>
                <input
                  id="contact-name"
                  name="contact-name"
                  type="text"
                  value={contact.name}
                  onChange={event => handleContactChange('name', event.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${
                    errors.contact.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder={L.form.namePlaceholder}
                  aria-invalid={Boolean(errors.contact.name)}
                />
                {errors.contact.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.form.emailLabel}
                </label>
                <input
                  id="contact-email"
                  name="contact-email"
                  type="email"
                  value={contact.email}
                  onChange={event => handleContactChange('email', event.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${
                    errors.contact.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder={L.form.emailPlaceholder}
                  aria-invalid={Boolean(errors.contact.email)}
                />
                {errors.contact.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-organization" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.form.orgLabel}
                </label>
                <input
                  id="contact-organization"
                  name="contact-organization"
                  type="text"
                  value={contact.organization}
                  onChange={event => handleContactChange('organization', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder={L.form.orgPlaceholder}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-6">
              <legend className="text-lg font-semibold text-black dark:text-white">{L.form.podcastsTitle}</legend>

              {podcasts.map((podcast, index) => (
                <div key={index} className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1">
                      <label htmlFor={`podcast-title-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {L.form.podcastTitleLabel}
                      </label>
                      <input
                        id={`podcast-title-${index}`}
                        name={`podcast-title-${index}`}
                        type="text"
                        value={podcast.title}
                        onChange={event => handlePodcastChange(index, 'title', event.target.value)}
                        className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 ${
                          errors.podcasts[index]?.title ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder={L.form.podcastTitlePlaceholder}
                        aria-invalid={Boolean(errors.podcasts[index]?.title)}
                      />
                      {errors.podcasts[index]?.title && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.podcasts[index].title}</p>
                      )}
                    </div>

                    <div className="flex-1">
                      <label htmlFor={`podcast-rss-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {L.form.podcastFeedLabel}
                      </label>
                      <input
                        id={`podcast-rss-${index}`}
                        name={`podcast-rss-${index}`}
                        type="url"
                        value={podcast.rss}
                        onChange={event => handlePodcastChange(index, 'rss', event.target.value)}
                        className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 ${
                          errors.podcasts[index]?.rss ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder={L.form.podcastFeedPlaceholder}
                        aria-invalid={Boolean(errors.podcasts[index]?.rss)}
                      />
                      {errors.podcasts[index]?.rss && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.podcasts[index].rss}</p>
                      )}
                    </div>
                  </div>

                  {podcasts.length > 1 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => removePodcast(index)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-900/30"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                          <path d="M19 13H5v-2h14v2Z" />
                        </svg>
                        {L.form.removePodcast}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addPodcast}
                className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-100 dark:hover:border-red-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
                </svg>
                {L.form.addPodcast}
              </button>
            </fieldset>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/50 sm:w-auto"
              >
                {L.form.submit}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">{L.form.localOnly}</p>
            </div>
          </form>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-black dark:text-white">{L.summaryTitle}</h2>

        {submissions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{L.summaryEmpty}</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {submissions.map(entry => (
              <article
                key={entry.id}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {L.summaryContact}
                    </p>
                    <p className="text-lg font-semibold text-black dark:text-white">{entry.contact.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{entry.contact.email}</p>
                    {entry.contact.organization && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{entry.contact.organization}</p>
                    )}
                  </div>
                  <time
                    dateTime={entry.submittedAt}
                    className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {new Date(entry.submittedAt).toLocaleString(lang)}
                  </time>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {L.summaryPodcasts}
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {entry.podcasts.map((podcast, index) => (
                      <li key={index} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/40">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{podcast.title}</p>
                        <a href={podcast.rss} className="mt-1 break-all text-xs text-red-600 underline dark:text-red-400">
                          {podcast.rss}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
