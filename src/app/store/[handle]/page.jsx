import Script from 'next/script';
import { breadcrumbSchema } from '../../../seo/schemas';
import ProductDetail from './ProductDetail';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

// Fetch single product from Shopify
async function getProduct(handle) {
  if (!SUPABASE_FUNCTIONS_URL) return null;

  try {
    const response = await fetch(
      `${SUPABASE_FUNCTIONS_URL}/shopify-get-product?handle=${encodeURIComponent(handle)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.product || null;
    }
  } catch (error) {
    console.error('Error loading product:', error);
  }
  return null;
}

// Fetch related products
async function getRelatedProducts(handle, productType, limit = 4) {
  if (!SUPABASE_FUNCTIONS_URL) return [];

  try {
    const response = await fetch(
      `${SUPABASE_FUNCTIONS_URL}/shopify-get-products?limit=${limit + 1}&product_type=${encodeURIComponent(productType || '')}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Filter out current product
      return (data.products || []).filter(p => p.handle !== handle).slice(0, limit);
    }
  } catch (error) {
    console.error('Error loading related products:', error);
  }
  return [];
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return {
      title: 'Produit non trouvé',
      description: 'Ce produit n\'existe pas ou n\'est plus disponible.',
    };
  }

  const description = product.description?.slice(0, 160) || `Achetez ${product.title} sur la boutique KracRadio`;

  return {
    title: `${product.title} - Boutique`,
    description,
    openGraph: {
      type: 'product',
      url: `${siteUrl}/store/${handle}`,
      title: product.title,
      description,
      images: product.image_url ? [{ url: product.image_url, width: 800, height: 800, alt: product.title }] : ['/icon.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      images: product.image_url ? [product.image_url] : ['/icon.png'],
    },
    alternates: {
      canonical: `${siteUrl}/store/${handle}`,
    },
  };
}

export default async function ProductPage({ params }) {
  const { handle } = await params;
  const product = await getProduct(handle);
  const relatedProducts = product ? await getRelatedProducts(handle, product.product_type) : [];

  // JSON-LD schemas
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Boutique', url: '/store' },
    { name: product?.title || 'Produit' }
  ]);

  // Product schema
  const productJsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || '',
    image: product.images || [product.image_url],
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'KracRadio',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/store/${handle}`,
      priceCurrency: 'CAD',
      price: product.price,
      availability: product.available !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'KracRadio',
      },
    },
  } : null;

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* JSON-LD */}
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {productJsonLd && (
        <Script
          id="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}

      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
