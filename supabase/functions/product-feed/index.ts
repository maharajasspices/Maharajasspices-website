import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://maharajasspices.co.za';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Exclude test/placeholder/non-main products
    const EXCLUDED_NAMES = ['pea dhall', 'test', 'placeholder', 'sample'];
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, price, original_price, brand, category, images, in_stock, weight, variants')
      .eq('in_stock', true)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return new Response('Error fetching products', { status: 500, headers: corsHeaders });
    }

    const categoryMap: Record<string, string> = {
      'Spices': 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices > Spices',
      'Marinades & Sauces': 'Food, Beverages & Tobacco > Food Items > Condiments & Sauces',
      'Pastes & Rubs': 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices',
      'Curry Powders': 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices > Spices',
      'Whole Spices': 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices > Spices',
      'Gifting': 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices',
      'Baking': 'Food, Beverages & Tobacco > Food Items > Baking Ingredients',
      'Rice & Grains': 'Food, Beverages & Tobacco > Food Items > Grains, Rice & Cereal',
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>Maharaja's Spices Product Feed</title>
<link>${SITE_URL}</link>
<description>Premium quality spices, sauces, marinades and seasonings</description>
`;

    for (const product of (products || [])) {
      const imageUrl = product.images?.[0] || '';
      if (!imageUrl) continue; // Skip products without images
      
      // Skip excluded products
      const lowerName = product.name.toLowerCase();
      if (EXCLUDED_NAMES.some(ex => lowerName.includes(ex))) continue;

      const availability = product.in_stock !== false ? 'in_stock' : 'out_of_stock';
      const googleCategory = categoryMap[product.category] || 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices';
      const cleanName = product.name.replace(/\s*-\s*\d+(\.\d+)?\s*$/, '').trim();

      // If product has variants, create an item group with individual variant items
      let variants: Array<{ weight: string; price: number }> = [];
      if (product.variants && Array.isArray(product.variants)) {
        variants = product.variants.map((v: any) => ({
          weight: v.weight || v.size || '',
          price: v.price || product.price,
        })).filter((v: any) => v.weight);
      }

      if (variants.length > 0) {
        for (const variant of variants) {
          xml += `<item>
  <g:id>${escapeXml(product.id)}-${escapeXml(variant.weight)}</g:id>
  <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
  <title>${escapeXml(cleanName)} - ${escapeXml(variant.weight)}</title>
  <description>${escapeXml(product.description || `Premium ${cleanName} from Maharaja's Spices`)}</description>
  <link>${SITE_URL}/product/${product.id}</link>
  <g:image_link>${escapeXml(imageUrl)}</g:image_link>
  <g:price>${variant.price.toFixed(2)} ZAR</g:price>
  ${product.original_price ? `<g:sale_price>${variant.price.toFixed(2)} ZAR</g:sale_price>` : ''}
  <g:availability>${availability}</g:availability>
  <g:condition>new</g:condition>
  <g:brand>${escapeXml(product.brand)}</g:brand>
  <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
  <g:product_type>${escapeXml(product.category)}</g:product_type>
  <g:shipping>
    <g:country>ZA</g:country>
    <g:service>Economy Delivery</g:service>
    <g:price>99.00 ZAR</g:price>
  </g:shipping>
  <g:size>${escapeXml(variant.weight)}</g:size>
</item>
`;
        }
      } else {
        xml += `<item>
  <g:id>${escapeXml(product.id)}</g:id>
  <title>${escapeXml(cleanName)}${product.weight ? ` - ${escapeXml(product.weight)}` : ''}</title>
  <description>${escapeXml(product.description || `Premium ${cleanName} from Maharaja's Spices`)}</description>
  <link>${SITE_URL}/product/${product.id}</link>
  <g:image_link>${escapeXml(imageUrl)}</g:image_link>
  <g:price>${product.price.toFixed(2)} ZAR</g:price>
  ${product.original_price ? `<g:sale_price>${product.price.toFixed(2)} ZAR</g:sale_price>` : ''}
  <g:availability>${availability}</g:availability>
  <g:condition>new</g:condition>
  <g:brand>${escapeXml(product.brand)}</g:brand>
  <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
  <g:product_type>${escapeXml(product.category)}</g:product_type>
  <g:shipping>
    <g:country>ZA</g:country>
    <g:service>Economy Delivery</g:service>
    <g:price>99.00 ZAR</g:price>
  </g:shipping>
</item>
`;
      }
    }

    xml += `</channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating product feed:', error);
    return new Response('Error generating feed', { status: 500, headers: corsHeaders });
  }
});
