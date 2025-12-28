import Script from 'next/script';
import { breadcrumbSchema } from '../../seo/schemas';
import StoreClientParts from './StoreClientParts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

// Fetch products from Shopify via Supabase Edge Function
async function getStoreProducts() {
  if (!SUPABASE_FUNCTIONS_URL) return [];

  try {
    const response = await fetch(
      `${SUPABASE_FUNCTIONS_URL}/shopify-get-products?limit=50`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.products || [];
    }
  } catch (error) {
    console.error('Error loading store products:', error);
  }
  return [];
}

export const metadata = {
  title: 'Boutique',
  description: 'Explorez la boutique KracRadio. Trouvez des t-shirts, hoodies, accessoires et plus encore pour supporter vos artistes indépendants préférés.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/store`,
    title: 'Boutique - KracRadio',
    description: 'Explorez la boutique KracRadio. T-shirts, hoodies, accessoires et plus.',
    images: ['/icon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boutique - KracRadio',
    description: 'Explorez la boutique KracRadio.',
    images: ['/icon.png'],
  },
  alternates: {
    canonical: `${siteUrl}/store`,
  },
};

export default async function StorePage() {
  const products = await getStoreProducts();

  // JSON-LD schema
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Boutique' }
  ]);

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* JSON-LD */}
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .product-card {
          opacity: 0;
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .product-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* Full-screen header */}
      <header className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Boutique"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative py-16 md:py-24">
          <div className="max-w-4xl pl-[60px] md:pl-[100px] pr-8">
            <span
              className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300 animate-fade-in-up"
              style={{ animationDelay: '0s' }}
            >
              Shop
            </span>
            <h1
              className="mt-4 text-4xl md:text-6xl font-black uppercase text-white animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              Boutique
            </h1>
            <p
              className="mt-4 max-w-3xl text-lg text-gray-200 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Supportez KracRadio et les artistes indépendants avec notre collection exclusive.
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-12">
        <StoreClientParts initialProducts={products} />
      </main>
    </div>
  );
}
