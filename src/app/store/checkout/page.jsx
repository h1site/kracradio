import Script from 'next/script';
import { breadcrumbSchema } from '../../../seo/schemas';
import CheckoutClient from './CheckoutClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Paiement - Boutique',
  description: 'Finalisez votre commande sur la boutique KracRadio.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Boutique', url: '/store' },
    { name: 'Paiement' }
  ]);

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <CheckoutClient />
    </div>
  );
}
