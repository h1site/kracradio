'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';
import GoogleAd from '../components/ads/GoogleAd';

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
    <main className="container-max pr-[30px] pl-[20px]">
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/podcasts"
        type="website"
      />

      {/* Hero avec image de fond */}
      <header className="relative -mx-8 -mt-8 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Podcasts"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative pl-[60px] md:pl-[100px] pr-8 py-16 md:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl max-w-2xl">
            {L.heroTitle}
          </h1>
          <p className="mt-4 text-lg text-gray-200 max-w-xl">
            {L.heroSubtitle}
          </p>
        </div>
      </header>

      <div className="py-8">
        <GoogleAd slot="3411355648" className="mx-auto max-w-4xl" />
      </div>

      {/* Info Section - Modern Design */}
      <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/50 dark:to-pink-950/50 p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/10 dark:bg-pink-400/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">{L.infoTitle}</h2>
              <p className="mt-2 text-purple-800 dark:text-purple-200 leading-relaxed">{L.infoBody}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-purple-200 bg-white/60 dark:border-purple-700 dark:bg-purple-900/20 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">{L.guidelinesTitle}</h3>
            </div>
            <ul className="space-y-3">
              {L.guidelines.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-purple-900 dark:text-purple-100 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Form Section - Modern Design */}
      <section className="mt-10">
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-800 dark:from-blue-950/50 dark:to-cyan-950/50 p-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{L.form.sectionTitle}</h2>
                <p className="text-sm text-blue-700 dark:text-blue-300">{L.form.sectionSubtitle}</p>
              </div>
            </div>

            {status === 'success' && (
              <div className="mt-6 rounded-2xl border border-green-500/40 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-600/40 p-5 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-green-900 dark:text-green-100">{L.successTitle}</p>
                    <p className="mt-1 text-sm text-green-800 dark:text-green-200">{L.successBody}</p>
                  </div>
                </div>
              </div>
            )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {/* Contact Fieldset */}
            <fieldset className="rounded-2xl border border-blue-200 bg-white/60 dark:border-blue-700 dark:bg-blue-900/10 backdrop-blur-sm p-6">
              <legend className="text-lg font-bold text-blue-900 dark:text-blue-100 px-3 mb-4">{L.form.contactTitle}</legend>

              <div className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {L.form.nameLabel}
                  </label>
                  <input
                    id="contact-name"
                    name="contact-name"
                    type="text"
                    value={contact.name}
                    onChange={event => handleContactChange('name', event.target.value)}
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-gray-100 ${
                      errors.contact.name
                        ? 'border-red-500 focus:border-red-600 focus:ring-red-600/30'
                        : 'border-gray-300 dark:border-gray-700 focus:border-blue-600 focus:ring-blue-600/30'
                    }`}
                    placeholder={L.form.namePlaceholder}
                    aria-invalid={Boolean(errors.contact.name)}
                  />
                  {errors.contact.name && (
                    <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.contact.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {L.form.emailLabel}
                  </label>
                  <input
                    id="contact-email"
                    name="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={event => handleContactChange('email', event.target.value)}
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-gray-100 ${
                      errors.contact.email
                        ? 'border-red-500 focus:border-red-600 focus:ring-red-600/30'
                        : 'border-gray-300 dark:border-gray-700 focus:border-blue-600 focus:ring-blue-600/30'
                    }`}
                    placeholder={L.form.emailPlaceholder}
                    aria-invalid={Boolean(errors.contact.email)}
                  />
                  {errors.contact.email && (
                    <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.contact.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-organization" className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {L.form.orgLabel}
                  </label>
                  <input
                    id="contact-organization"
                    name="contact-organization"
                    type="text"
                    value={contact.organization}
                    onChange={event => handleContactChange('organization', event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    placeholder={L.form.orgPlaceholder}
                  />
                </div>
              </div>
            </fieldset>

            {/* Podcasts Fieldset */}
            <fieldset className="rounded-2xl border border-blue-200 bg-white/60 dark:border-blue-700 dark:bg-blue-900/10 backdrop-blur-sm p-6">
              <legend className="text-lg font-bold text-blue-900 dark:text-blue-100 px-3 mb-4">{L.form.podcastsTitle}</legend>

              <div className="space-y-5">
                {podcasts.map((podcast, index) => (
                  <div key={index} className="rounded-xl border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-950/30 dark:to-blue-950/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="flex-1">
                        <label htmlFor={`podcast-title-${index}`} className="block text-sm font-semibold text-cyan-900 dark:text-cyan-100 mb-2">
                          {L.form.podcastTitleLabel}
                        </label>
                        <input
                          id={`podcast-title-${index}`}
                          name={`podcast-title-${index}`}
                          type="text"
                          value={podcast.title}
                          onChange={event => handlePodcastChange(index, 'title', event.target.value)}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-gray-100 ${
                            errors.podcasts[index]?.title
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-600/30'
                              : 'border-gray-300 dark:border-gray-700 focus:border-cyan-600 focus:ring-cyan-600/30'
                          }`}
                          placeholder={L.form.podcastTitlePlaceholder}
                          aria-invalid={Boolean(errors.podcasts[index]?.title)}
                        />
                        {errors.podcasts[index]?.title && (
                          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.podcasts[index].title}
                          </p>
                        )}
                      </div>

                      <div className="flex-1">
                        <label htmlFor={`podcast-rss-${index}`} className="block text-sm font-semibold text-cyan-900 dark:text-cyan-100 mb-2">
                          {L.form.podcastFeedLabel}
                        </label>
                        <input
                          id={`podcast-rss-${index}`}
                          name={`podcast-rss-${index}`}
                          type="url"
                          value={podcast.rss}
                          onChange={event => handlePodcastChange(index, 'rss', event.target.value)}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-gray-100 ${
                            errors.podcasts[index]?.rss
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-600/30'
                              : 'border-gray-300 dark:border-gray-700 focus:border-cyan-600 focus:ring-cyan-600/30'
                          }`}
                          placeholder={L.form.podcastFeedPlaceholder}
                          aria-invalid={Boolean(errors.podcasts[index]?.rss)}
                        />
                        {errors.podcasts[index]?.rss && (
                          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.podcasts[index].rss}
                          </p>
                        )}
                      </div>
                    </div>

                    {podcasts.length > 1 && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => removePodcast(index)}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-300 transition-all hover:bg-red-200 dark:hover:bg-red-900/50 hover:shadow-md"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
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
                  className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-500 px-6 py-3.5 text-sm font-bold text-white transition-all hover:from-cyan-700 hover:to-blue-700 dark:hover:from-cyan-600 dark:hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
                  </svg>
                  {L.form.addPodcast}
                </button>
              </div>
            </fieldset>

            {/* Submit Button */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                className="inline-flex h-14 w-full md:w-auto items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-500 dark:to-pink-500 px-8 text-base font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:from-red-700 hover:to-pink-700 dark:hover:from-red-600 dark:hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-red-600/30 hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {L.form.submit}
              </button>
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {L.form.localOnly}
              </p>
            </div>
          </form>
          </div>
        </div>
      </section>

      {/* Submissions Section */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white">{L.summaryTitle}</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 font-medium">{L.summaryEmpty}</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {submissions.map(entry => (
              <article
                key={entry.id}
                className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:border-orange-800 dark:from-orange-950/30 dark:to-red-950/30 p-6 shadow-lg transition-all hover:shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 dark:bg-orange-400/5 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
                          {L.summaryContact}
                        </p>
                        <p className="text-xl font-bold text-orange-900 dark:text-orange-100">{entry.contact.name}</p>
                        <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2 mt-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          {entry.contact.email}
                        </p>
                        {entry.contact.organization && (
                          <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2 mt-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                            {entry.contact.organization}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <time
                    dateTime={entry.submittedAt}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-200 dark:bg-orange-900/40 text-xs font-semibold uppercase tracking-wide text-orange-900 dark:text-orange-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {new Date(entry.submittedAt).toLocaleString(lang)}
                  </time>
                </div>

                <div className="mt-6 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      {L.summaryPodcasts}
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {entry.podcasts.map((podcast, index) => (
                      <li key={index} className="rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-white/70 dark:bg-orange-900/20 backdrop-blur-sm px-5 py-4 shadow-sm hover:shadow-md transition-all">
                        <p className="font-bold text-orange-900 dark:text-orange-100 mb-2">{podcast.title}</p>
                        <a
                          href={podcast.rss}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-xs text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 underline decoration-dotted hover:decoration-solid transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
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
