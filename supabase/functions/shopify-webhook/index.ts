// supabase/functions/shopify-webhook/index.ts
// Handles Shopify webhooks for orders (order creation, fulfillment)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const SHOPIFY_WEBHOOK_SECRET = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

// Verify Shopify webhook signature
async function verifyShopifyWebhook(body: string, hmacHeader: string): Promise<boolean> {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.warn('SHOPIFY_WEBHOOK_SECRET not configured, skipping verification');
    return true; // In development, allow without verification
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SHOPIFY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return computedHmac === hmacHeader;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  created_at: string;
  currency: string;
  total_price: string;
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
  customer?: {
    id: number;
    email: string;
  };
  billing_address?: {
    country_code: string;
  };
  shipping_address?: {
    country_code: string;
  };
}

async function processOrder(order: ShopifyOrder, supabase: any) {
  console.log(`Processing order #${order.order_number} with ${order.line_items.length} items`);

  const results = [];

  for (const item of order.line_items) {
    // Find the store_product by shopify_product_id
    const { data: storeProduct, error: findError } = await supabase
      .from('store_products')
      .select('id, user_id, commission_artist_percent, commission_platform_percent')
      .eq('shopify_product_id', item.product_id.toString())
      .single();

    if (findError || !storeProduct) {
      console.log(`Product ${item.product_id} not found in store_products, skipping`);
      continue;
    }

    const itemPrice = parseFloat(item.price);
    const quantity = item.quantity;
    const grossRevenue = itemPrice * quantity;
    const artistPercent = storeProduct.commission_artist_percent || 85;
    const platformPercent = storeProduct.commission_platform_percent || 15;
    const artistRevenue = grossRevenue * (artistPercent / 100);
    const platformRevenue = grossRevenue * (platformPercent / 100);

    // Insert sale record
    const { data: sale, error: insertError } = await supabase
      .from('store_sales')
      .insert({
        shopify_order_id: order.id.toString(),
        shopify_line_item_id: item.id.toString(),
        shopify_product_id: item.product_id.toString(),
        store_product_id: storeProduct.id,
        user_id: storeProduct.user_id,
        quantity: quantity,
        unit_price: itemPrice,
        currency: order.currency,
        revenue_gross: grossRevenue,
        revenue_artist: artistRevenue,
        revenue_platform: platformRevenue,
        customer_country: order.billing_address?.country_code || order.shipping_address?.country_code || null,
        order_date: order.created_at,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate (unique constraint on shopify_order_id + line_item_id)
      if (insertError.code === '23505') {
        console.log(`Sale already recorded for order ${order.id}, line item ${item.id}`);
      } else {
        console.error('Error inserting sale:', insertError);
      }
    } else {
      console.log(`Sale recorded: ${sale.id} - $${grossRevenue} (Artist: $${artistRevenue})`);
      results.push(sale);
    }
  }

  return results;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get webhook headers
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');

    console.log(`Received Shopify webhook: ${topic} from ${shopDomain}`);

    // Read body as text for HMAC verification
    const bodyText = await req.text();

    // Verify webhook signature
    if (hmacHeader) {
      const isValid = await verifyShopifyWebhook(bodyText, hmacHeader);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Parse body
    const body = JSON.parse(bodyText);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
      case 'orders/paid': {
        const results = await processOrder(body as ShopifyOrder, supabase);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Processed ${results.length} line items`,
            sales: results.map(s => s.id)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'orders/cancelled': {
        // Mark sales as cancelled (optional: could add a status field to store_sales)
        console.log(`Order cancelled: ${body.id}`);
        // For now, just log it - could implement refund logic here
        return new Response(
          JSON.stringify({ success: true, message: 'Order cancellation noted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'products/delete': {
        // Update store_product status when product is deleted from Shopify
        const productId = body.id.toString();
        await supabase
          .from('store_products')
          .update({ status: 'disabled' })
          .eq('shopify_product_id', productId);

        console.log(`Product ${productId} marked as disabled`);
        return new Response(
          JSON.stringify({ success: true, message: 'Product disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
        return new Response(
          JSON.stringify({ success: true, message: `Topic ${topic} not handled` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in shopify-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
