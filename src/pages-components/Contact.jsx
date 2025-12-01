'use client';
// src/pages/Contact.jsx
import React from 'react';
import Link from 'next/link';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { contactPageSchema, organizationSchema, breadcrumbSchema } from '../seo/schemas';

const LOGO_ZIP_URL =
  'https://www.dropbox.com/scl/fi/n0hat7f6m2k9p1rbo5j5l/package.zip?rlkey=yscogkwugmuyvma79n6pt71pv&st=7ztg6xkg&dl=0';

export default function Contact() {
  const { t, lang } = useI18n();

  return (
    <main className="container-max pr-[30px] pl-[20px]">
      <Seo
        lang={lang}
        title={t.meta.contactTitle}
        description={t.meta.contactDesc}
        path="/contact"
        type="website"
        jsonLd={[
          contactPageSchema,
          organizationSchema,
          breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: t.contact.title }
          ])
        ]}
      />

      {/* Hero avec image de fond */}
      <header className="relative -mx-8 -mt-8 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Contact"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative pl-[60px] md:pl-[100px] pr-8 py-16 md:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl max-w-2xl">
            {t.contact.title}
          </h1>
          <p className="mt-4 text-lg text-gray-200 max-w-xl">
            {lang === 'fr' ? 'Nous sommes là pour vous aider. Contactez-nous pour toute question ou collaboration.' :
             lang === 'es' ? 'Estamos aquí para ayudarte. Contáctanos para cualquier pregunta o colaboración.' :
             'We are here to help. Contact us for any questions or collaboration.'}
          </p>
        </div>
      </header>

      {/* Grille 2 colonnes (1 sur mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche — Infos */}
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">
            {t.contact.infoTitle}
          </h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="opacity-70">{t.contact.ownerLabel}</dt>
              <dd className="font-medium text-right">{t.contact.ownerName}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="opacity-70">{t.contact.consultantLabel}</dt>
              <dd className="font-medium text-right">{t.contact.consultantName}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="opacity-70">{t.contact.emailLabel}</dt>
              <dd className="font-medium text-right">
                <a href={`mailto:${t.contact.email}`} className="underline">
                  {t.contact.email}
                </a>
              </dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="opacity-70">{t.contact.phoneLabel}</dt>
              <dd className="font-medium text-right">
                <a href="tel:+15142657825" className="underline">514-265-7825</a>
              </dd>
            </div>
          </dl>

          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
            <h3 className="text-sm font-semibold mb-1">{t.contact.addressTitle}</h3>
            <address className="not-italic text-sm opacity-90">
              {t.contact.addressLine1}<br />
              {t.contact.addressLine2}
            </address>
          </div>
        </section>

        {/* Colonne droite — Blocs */}
        <section className="lg:col-span-2 space-y-5">
          {/* Envoyer musique */}
          <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm dark:border-purple-800 dark:from-purple-950/50 dark:to-pink-950/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">{t.contact.sendMusic.title}</h2>
              </div>
              <p className="text-sm mb-4 text-purple-800 dark:text-purple-200">
                {lang === 'fr' ? 'Utilisez notre nouveau système de soumission de musique pour partager vos créations avec nous.' :
                 lang === 'es' ? 'Utiliza nuestro nuevo sistema de envío de música para compartir tus creaciones con nosotros.' :
                 'Use our new music submission system to share your creations with us.'}
              </p>
              <Link
                href="/submit-music"
                className="inline-flex items-center gap-2 px-6 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {lang === 'fr' ? 'Soumettre ma musique' : lang === 'es' ? 'Enviar mi música' : 'Submit My Music'}
              </Link>
            </div>
          </div>

          {/* Commandite */}
          <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm dark:border-blue-800 dark:from-blue-950/50 dark:to-cyan-950/50 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">{t.contact.sponsor.title}</h2>
              </div>
              <p className="text-sm mb-2 text-blue-800 dark:text-blue-200">
                {t.contact.sponsor.desc1}{' '}
                <a href={`mailto:${t.contact.email}`} className="underline font-semibold hover:text-blue-600 dark:hover:text-blue-300">{t.contact.email}</a>
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 opacity-80">{t.contact.sponsor.desc2}</p>
            </div>
          </div>

          {/* Don */}
          <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm dark:border-red-800 dark:from-red-950/50 dark:to-orange-950/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-400/10 dark:bg-red-400/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 dark:bg-red-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-red-900 dark:text-red-100">{t.contact.donation.title}</h2>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">{t.contact.donation.desc1}</p>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4 opacity-80">{t.contact.donation.desc2}</p>
              <a
                href="https://www.paypal.com/donate/?hosted_button_id=GUPL4K5WR3ZG4"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {t.site.donation}
              </a>
            </div>
          </div>

          {/* Logos / Branding */}
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 p-6 shadow-sm dark:border-gray-700 dark:from-gray-900/50 dark:to-slate-900/50 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gray-400/10 dark:bg-gray-400/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gray-700 dark:bg-gray-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.contact.brand.title}</h2>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{t.contact.brand.desc}</p>
              <a
                href={LOGO_ZIP_URL}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 h-12 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7Z"/>
                </svg>
                {t.contact.brand.button}
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
