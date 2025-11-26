// supabase/functions/shopify-create-product/index.ts
// Creates a digital product in Shopify when admin approves a store submission
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN'); // e.g., store-kracradio.myshopify.com
const SHOPIFY_ADMIN_API_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
const SHOPIFY_API_VERSION = '2024-10'; // Updated to latest stable version

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateProductRequest {
  store_product_id: string;
  track_title: string;
  artist_name: string;
  price: number;
  currency: string;
  product_type: 'single' | 'ep' | 'album';
  cover_image_url?: string;
  preview_url?: string;
  track_file_url?: string;
}

async function createShopifyProduct(data: CreateProductRequest) {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN) {
    console.error('Missing Shopify config:', {
      hasDomain: !!SHOPIFY_STORE_DOMAIN,
      hasToken: !!SHOPIFY_ADMIN_API_TOKEN
    });
    throw new Error('Shopify credentials not configured');
  }

  console.log('Shopify config:', { domain: SHOPIFY_STORE_DOMAIN, apiVersion: SHOPIFY_API_VERSION });

  const shopifyUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json`;
  console.log('Shopify API URL:', shopifyUrl);

  // Product type labels
  const typeLabels: Record<string, string> = {
    single: 'Single',
    ep: 'EP',
    album: 'Album'
  };

  const productType = data.product_type || 'single';
  const typeLabel = typeLabels[productType] || 'Single';
  const priceValue = typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0;

  // Create the product payload
  const productPayload = {
    product: {
      title: `${data.artist_name} - ${data.track_title}`,
      body_html: `<p>Digital ${typeLabel} by ${data.artist_name}</p><p>High quality digital download.</p>`,
      vendor: data.artist_name,
      product_type: `Digital Music - ${typeLabel}`,
      tags: ['digital-download', 'music', productType, 'kracradio'],
      status: 'active',
      variants: [
        {
          price: priceValue.toFixed(2),
          sku: `KRAC-${data.store_product_id.substring(0, 8).toUpperCase()}`,
          inventory_management: null, // Digital product, no inventory tracking
          requires_shipping: false,
          taxable: true,
        }
      ],
      // Add metafields for digital delivery
      metafields: [
        {
          namespace: 'kracradio',
          key: 'store_product_id',
          value: data.store_product_id,
          type: 'single_line_text_field'
        },
        {
          namespace: 'kracradio',
          key: 'artist_name',
          value: data.artist_name,
          type: 'single_line_text_field'
        },
        {
          namespace: 'kracradio',
          key: 'product_type',
          value: data.product_type,
          type: 'single_line_text_field'
        }
      ]
    }
  };

  // Add image if provided - fetch and convert to base64 for better compatibility
  console.log('Cover image URL:', data.cover_image_url);
  if (data.cover_image_url) {
    try {
      console.log('Fetching cover image...');
      const imageResponse = await fetch(data.cover_image_url);
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

        console.log('Image fetched successfully, size:', imageBlob.size, 'type:', contentType);

        productPayload.product.images = [
          {
            attachment: base64Image,
            filename: `${data.artist_name}-${data.track_title}-cover.jpg`.replace(/[^a-zA-Z0-9.-]/g, '_'),
            alt: `${data.artist_name} - ${data.track_title} cover`
          }
        ];
        console.log('Added cover image to product (base64)');
      } else {
        console.error('Failed to fetch cover image:', imageResponse.status);
        // Fallback to URL method
        productPayload.product.images = [
          {
            src: data.cover_image_url,
            alt: `${data.artist_name} - ${data.track_title} cover`
          }
        ];
        console.log('Falling back to URL method for cover image');
      }
    } catch (imageError) {
      console.error('Error processing cover image:', imageError);
      // Fallback to URL method
      productPayload.product.images = [
        {
          src: data.cover_image_url,
          alt: `${data.artist_name} - ${data.track_title} cover`
        }
      ];
      console.log('Falling back to URL method for cover image');
    }
  } else {
    console.log('No cover image provided');
  }

  console.log('Creating Shopify product:', productPayload.product.title);
  console.log('Request payload:', JSON.stringify(productPayload, null, 2));

  const requestBody = JSON.stringify(productPayload);
  console.log('Request body length:', requestBody.length);

  const response = await fetch(shopifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
    },
    body: requestBody,
  });

  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log('Shopify API response status:', response.status);
  console.log('Shopify API response:', responseText);

  if (!response.ok) {
    console.error('Shopify API error:', responseText);
    throw new Error(`Shopify API error: ${response.status} - ${responseText}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Invalid JSON response from Shopify: ${responseText}`);
  }

  if (!result.product || !result.product.id) {
    console.error('Invalid product response:', result);
    throw new Error(`Shopify did not return a valid product: ${JSON.stringify(result)}`);
  }

  console.log('Shopify product created:', result.product.id);

  // Check if image was uploaded
  const hasImage = result.product.images && result.product.images.length > 0;
  console.log('Product has image:', hasImage);
  if (hasImage) {
    console.log('Image details:', result.product.images[0]);
  }

  // Attach digital download file if provided
  let mp3Attached = false;
  let mp3Error = null;
  if (data.track_file_url) {
    try {
      console.log('Attempting to attach MP3 file:', data.track_file_url);
      await attachDigitalDownload(
        result.product.id.toString(),
        result.product.variants[0].id.toString(),
        data.track_file_url,
        `${data.artist_name} - ${data.track_title}.mp3`
      );
      console.log('Digital download attached successfully');
      mp3Attached = true;
    } catch (fileError) {
      console.error('Error attaching digital download:', fileError);
      mp3Error = fileError.message;
      // Don't fail the whole operation if file attachment fails
    }
  } else {
    console.log('No track file URL provided');
  }

  return {
    shopify_product_id: result.product.id.toString(),
    shopify_variant_id: result.product.variants[0].id.toString(),
    shopify_handle: result.product.handle,
    has_image: hasImage,
    mp3_attached: mp3Attached,
    mp3_error: mp3Error,
  };
}

// Attach MP3 file as digital download using Shopify's GraphQL API
async function attachDigitalDownload(
  productId: string,
  variantId: string,
  fileUrl: string,
  fileName: string
) {
  // Use GraphQL API to create a file and attach it to the product
  const graphqlUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  // Step 1: Create a staged upload to get the upload URL
  const stagedUploadQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const stagedUploadResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN!,
    },
    body: JSON.stringify({
      query: stagedUploadQuery,
      variables: {
        input: [{
          resource: 'FILE',
          filename: fileName,
          mimeType: 'audio/mpeg',
          httpMethod: 'POST'
        }]
      }
    })
  });

  const stagedUploadResult = await stagedUploadResponse.json();
  console.log('Staged upload result:', JSON.stringify(stagedUploadResult, null, 2));

  if (stagedUploadResult.data?.stagedUploadsCreate?.userErrors?.length > 0) {
    throw new Error(`Staged upload error: ${JSON.stringify(stagedUploadResult.data.stagedUploadsCreate.userErrors)}`);
  }

  const stagedTarget = stagedUploadResult.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!stagedTarget) {
    throw new Error('No staged target returned');
  }

  // Step 2: Download the file from the source URL
  console.log('Downloading file from:', fileUrl);
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to download file: ${fileResponse.status}`);
  }
  const fileBlob = await fileResponse.blob();
  console.log('File downloaded, size:', fileBlob.size);

  // Step 3: Upload the file to the staged URL
  const formData = new FormData();
  for (const param of stagedTarget.parameters) {
    formData.append(param.name, param.value);
  }
  formData.append('file', fileBlob, fileName);

  const uploadResponse = await fetch(stagedTarget.url, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const uploadError = await uploadResponse.text();
    throw new Error(`File upload failed: ${uploadResponse.status} - ${uploadError}`);
  }
  console.log('File uploaded to staged URL');

  // Step 4: Create the file in Shopify using the resourceUrl
  const createFileQuery = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          alt
          createdAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const createFileResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN!,
    },
    body: JSON.stringify({
      query: createFileQuery,
      variables: {
        files: [{
          alt: fileName,
          contentType: 'FILE',
          originalSource: stagedTarget.resourceUrl
        }]
      }
    })
  });

  const createFileResult = await createFileResponse.json();
  console.log('Create file result:', JSON.stringify(createFileResult, null, 2));

  if (createFileResult.data?.fileCreate?.userErrors?.length > 0) {
    throw new Error(`File create error: ${JSON.stringify(createFileResult.data.fileCreate.userErrors)}`);
  }

  const fileId = createFileResult.data?.fileCreate?.files?.[0]?.id;
  if (!fileId) {
    throw new Error('No file ID returned');
  }

  // Step 5: Store file URL in product metafield for digital delivery
  const metafieldQuery = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const metafieldResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN!,
    },
    body: JSON.stringify({
      query: metafieldQuery,
      variables: {
        input: {
          id: `gid://shopify/Product/${productId}`,
          metafields: [
            {
              namespace: 'kracradio',
              key: 'download_file_id',
              value: fileId,
              type: 'single_line_text_field'
            },
            {
              namespace: 'kracradio',
              key: 'download_url',
              value: fileUrl,
              type: 'url'
            }
          ]
        }
      }
    })
  });

  const metafieldResult = await metafieldResponse.json();
  console.log('Metafield update result:', JSON.stringify(metafieldResult, null, 2));

  return fileId;
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
    const body: CreateProductRequest = await req.json();

    if (!body.store_product_id || !body.track_title || !body.artist_name || !body.price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create product in Shopify
    const shopifyResult = await createShopifyProduct(body);

    // Update store_products with Shopify IDs
    const { error: updateError } = await supabase
      .from('store_products')
      .update({
        shopify_product_id: shopifyResult.shopify_product_id,
        shopify_variant_id: shopifyResult.shopify_variant_id,
        status: 'live',
        published_at: new Date().toISOString(),
      })
      .eq('id', body.store_product_id);

    if (updateError) {
      console.error('Error updating store_products:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product created in Shopify',
        shopify_product_id: shopifyResult.shopify_product_id,
        shopify_variant_id: shopifyResult.shopify_variant_id,
        shopify_url: `https://${SHOPIFY_STORE_DOMAIN?.replace('.myshopify.com', '')}.com/products/${shopifyResult.shopify_handle}`,
        has_image: shopifyResult.has_image,
        mp3_attached: shopifyResult.mp3_attached,
        mp3_error: shopifyResult.mp3_error,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in shopify-create-product:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
