// src/pages/Contact.jsx
import React from 'react';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';

const RED = '#E50914';
const LOGO_ZIP_URL =
  'https://www.dropbox.com/scl/fi/n0hat7f6m2k9p1rbo5j5l/package.zip?rlkey=yscogkwugmuyvma79n6pt71pv&st=7ztg6xkg&dl=0';

export default function Contact() {
  const { t, lang } = useI18n();

  return (
    <main className="container-max px-5 pb-5">
      <Seo
        lang={lang}
        title={t.meta.contactTitle}
        description={t.meta.contactDesc}
        path="/contact"
        type="website"
      />

      {/* Titre */}
      <h1 className="text-2xl font-extrabold mb-4 pt-14">
        {t.contact.title}
      </h1>

      {/* Grille 2 colonnes (1 sur mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche — Infos */}
        <section className="card dark:bg-[#1e1e1e] p-4">
          <h2 className="text-lg font-semibold mb-3" style={{ color: RED }}>
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
          <div className="card dark:bg-[#1e1e1e] p-4">
            <h2 className="text-lg font-semibold mb-2">{t.contact.sendMusic.title}</h2>
            <p className="text-sm mb-1">
              {t.contact.sendMusic.desc1}{' '}
              <a href={`mailto:${t.contact.email}`} className="underline">{t.contact.email}</a>
            </p>
            <p className="text-sm opacity-90">{t.contact.sendMusic.desc2}</p>
          </div>

          {/* Commandite */}
          <div className="card dark:bg-[#1e1e1e] p-4">
            <h2 className="text-lg font-semibold mb-2">{t.contact.sponsor.title}</h2>
            <p className="text-sm mb-1">
              {t.contact.sponsor.desc1}{' '}
              <a href={`mailto:${t.contact.email}`} className="underline">{t.contact.email}</a>
            </p>
            <p className="text-sm opacity-90">{t.contact.sponsor.desc2}</p>
          </div>

          {/* Don */}
          <div className="card dark:bg-[#1e1e1e] p-4">
            <h2 className="text-lg font-semibold mb-2">{t.contact.donation.title}</h2>
            <p className="text-sm opacity-90 mb-3">{t.contact.donation.desc1}</p>
            <p className="text-sm opacity-90 mb-4">{t.contact.donation.desc2}</p>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=GUPL4K5WR3ZG4"
              target="_blank" rel="noopener noreferrer"
              className="btn-primary rounded-xl inline-flex h-11 px-5 font-semibold"
            >
              {t.site.donation}
            </a>
          </div>

          {/* Logos / Branding */}
          <div className="card dark:bg-[#1e1e1e] p-4">
            <h2 className="text-lg font-semibold mb-2">{t.contact.brand.title}</h2>
            <p className="text-sm opacity-90 mb-4">{t.contact.brand.desc}</p>
            <a
              href={LOGO_ZIP_URL}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {/* icône téléchargement simple */}
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
