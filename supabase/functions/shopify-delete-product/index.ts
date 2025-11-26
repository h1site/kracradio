// supabase/functions/shopify-delete-product/index.ts
// Deletes a product from Shopify (used for resync functionality)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
const SHOPIFY_ADMIN_API_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
const SHOPIFY_API_VERSION = '2024-10';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteProductRequest {
  store_product_id: string;
  shopify_product_id: string;
}

async function deleteShopifyProduct(shopifyProductId: string) {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const shopifyUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${shopifyProductId}.json`;
  console.log('Deleting Shopify product:', shopifyUrl);

  const response = await fetch(shopifyUrl, {
    method: 'DELETE',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
    },
  });

  console.log('Shopify delete response status:', response.status);

  // 200 = success, 404 = already deleted (which is fine)
  if (!response.ok && response.status !== 404) {
    const responseText = await response.text();
    console.error('Shopify API error:', responseText);
    throw new Error(`Shopify API error: ${response.status} - ${responseText}`);
  }

  return { deleted: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: DeleteProductRequest = await req.json();

    if (!body.store_product_id || !body.shopify_product_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (store_product_id, shopify_product_id)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete product from Shopify
    await deleteShopifyProduct(body.shopify_product_id);

    // Reset store_products status to approved (so it can be resynced)
    const { error: updateError } = await supabase
      .from('store_products')
      .update({
        shopify_product_id: null,
        shopify_variant_id: null,
        status: 'approved',
        published_at: null,
      })
      .eq('id', body.store_product_id);

    if (updateError) {
      console.error('Error updating store_products:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product deleted from Shopify and reset for resync',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in shopify-delete-product:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
