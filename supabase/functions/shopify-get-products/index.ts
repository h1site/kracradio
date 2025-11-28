// supabase/functions/shopify-get-products/index.ts
// Fetches random products from Shopify store for homepage display
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
const SHOPIFY_ADMIN_API_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
const SHOPIFY_API_VERSION = '2024-10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN) {
      throw new Error('Shopify credentials not configured');
    }

    // Get limit from query params (default 5)
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);

    // Fetch active products from Shopify
    const shopifyUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?status=active&limit=50`;

    const response = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error:', errorText);
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products || [];

    // Shuffle and take requested number
    const shuffled = products.sort(() => 0.5 - Math.random());
    const randomProducts = shuffled.slice(0, limit);

    // Transform to simpler format for frontend
    const transformedProducts = randomProducts.map((product: any) => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      price: product.variants?.[0]?.price || '0.00',
      compare_at_price: product.variants?.[0]?.compare_at_price || null,
      image_url: product.image?.src || product.images?.[0]?.src || null,
      handle: product.handle,
      product_type: product.product_type,
    }));

    return new Response(
      JSON.stringify({ products: transformedProducts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(
      JSON.stringify({ error: error.message, products: [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
