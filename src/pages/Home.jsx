// src/pages/Home.jsx
import React from 'react';
import { channels } from '../data/channels';
import ChannelCarousel from '../components/ChannelCarousel';
import { useI18n } from '../i18n';

export default function Home() {
  const { t } = useI18n();

  return (
    <main className="py-0">
      {/* Section simple pleine largeur, alignée à gauche, même padding que le header */}
      <section className="w-full">
        <div className="px-5 pt-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
            {t.home.channelsHeading}
          </h2>
        </div>

        <ChannelCarousel channels={channels} />
      </section>
    </main>
  );
}
