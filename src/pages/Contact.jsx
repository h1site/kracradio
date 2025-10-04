// src/pages/Contact.jsx
import React from 'react';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';

const LOGO_ZIP_URL =
  'https://www.dropbox.com/scl/fi/n0hat7f6m2k9p1rbo5j5l/package.zip?rlkey=yscogkwugmuyvma79n6pt71pv&st=7ztg6xkg&dl=0';

export default function Contact() {
  const { t, lang } = useI18n();

  return (
    <main className="container-max pr-[30px]">
      <Seo
        lang={lang}
        title={t.meta.contactTitle}
        description={t.meta.contactDesc}
        path="/contact"
        type="website"
      />

      <header className="pb-12">
        <span className="inline-flex items-center rounded-full border border-red-600/40 bg-red-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          Contact
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
          {t.contact.title}
        </h1>
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
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold mb-2 text-black dark:text-white">{t.contact.sendMusic.title}</h2>
            <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
              {t.contact.sendMusic.desc1}{' '}
              <a href={`mailto:${t.contact.email}`} className="underline text-red-600 dark:text-red-400">{t.contact.email}</a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.contact.sendMusic.desc2}</p>
          </div>

          {/* Commandite */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold mb-2 text-black dark:text-white">{t.contact.sponsor.title}</h2>
            <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
              {t.contact.sponsor.desc1}{' '}
              <a href={`mailto:${t.contact.email}`} className="underline text-red-600 dark:text-red-400">{t.contact.email}</a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.contact.sponsor.desc2}</p>
          </div>

          {/* Don */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold mb-2 text-black dark:text-white">{t.contact.donation.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t.contact.donation.desc1}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t.contact.donation.desc2}</p>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=GUPL4K5WR3ZG4"
              target="_blank" rel="noopener noreferrer"
              className="btn-primary rounded-xl inline-flex h-11 px-5 font-semibold"
            >
              {t.site.donation}
            </a>
          </div>

          {/* Logos / Branding */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold mb-2 text-black dark:text-white">{t.contact.brand.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t.contact.brand.desc}</p>
            <a
              href={LOGO_ZIP_URL}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7Z"/>
              </svg>
              {t.contact.brand.button}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
