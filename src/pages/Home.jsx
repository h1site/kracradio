import React from 'react';
import { channels } from '../data/channels';
import ChannelCarousel from '../components/ChannelCarousel';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { websiteJsonLd, organizationJsonLd } from '../seo/jsonld';

export default function Home() {
  const { t, lang } = useI18n();

  return (
    <main className="py-0">
      <Seo
        lang={lang}
        title={t.meta.homeTitle}
        description={t.meta.homeDesc}
        path="/"
        type="website"
        alternates
        jsonLd={[websiteJsonLd(lang), organizationJsonLd()]}
      />
      <section className="w-full">
        <div className="px-5 pt-10 md:pt-12">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
            {t.home.channelsHeading}
          </h2>
        </div>
        <ChannelCarousel channels={channels} />
      </section>
    </main>
  );
}
