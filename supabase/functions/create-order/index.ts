import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 orders per hour per IP
const RATE_WINDOW = 3600000; // 1 hour in ms
const VAT_RATE = 0.15;
const ZERO_RATED_KEYWORDS = ['sugar beans', 'white rice', 'masoor', 'breyani dhall', 'raw nuts', 'nuts', 'pea dhall'];
const KG_REGEX = /([\d.]+)\s*kg/i;
const G_REGEX = /([\d.]+)\s*g/i;
const ML_REGEX = /([\d.]+)\s*ml/i;
const L_REGEX = /([\d.]+)\s*l/i;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) return false;
  userLimit.count++;
  return true;
}

function isZeroRated(itemName: string): boolean {
  const lowerName = itemName.toLowerCase();
  return ZERO_RATED_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

interface ProductVariant {
  weight: string;
  price: number;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string; // Selected variant weight (e.g., "50g", "100g")
}

interface ShippingAddress {
  fullName: string;
  email: string;
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  phone: string;
  service_level?: string | null;
}

interface CreateOrderRequest {
  user_id?: string | null;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  credits_used?: number;
  voucher_code?: string;
  voucher_discount?: number;
  courier?: string;
  courier_cost?: number;
  courier_markup?: number;
  shipping_address: ShippingAddress;
  items: OrderItem[];
}

function normalizeServiceLevel(serviceLevel?: string | null): string | null {
  if (!serviceLevel) return null;

  const normalized = serviceLevel.trim().toUpperCase();
  const aliases: Record<string, string> = {
    ECONOMY: 'ECO',
    ECOLOCAL: 'ECO',
    OVERNIGHT: 'OVN',
  };

  return aliases[normalized] || normalized;
}

function parseWeightToKg(value?: string | null): number {
  if (!value) return 0;
  const normalized = value.trim();
  const kg = normalized.match(KG_REGEX);
  if (kg) return Number(kg[1]);
  const g = normalized.match(G_REGEX);
  if (g) return Number(g[1]) / 1000;
  const ml = normalized.match(ML_REGEX);
  if (ml) return Number(ml[1]) / 1000;
  const l = normalized.match(L_REGEX);
  if (l) return Number(l[1]);
  return 0;
}

serve(async (req: Request) => {
  console.log('=== Create Order Request ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.error('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many orders. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreateOrderRequest = await req.json();
    console.log('Order request received:', JSON.stringify({
      subtotal: body.subtotal,
      total: body.total,
      courier: body.courier,
      itemCount: body.items?.length,
    }));

    // Validate required fields
    if (!body.shipping_address) {
      console.error('Missing shipping address');
      return new Response(
        JSON.stringify({ error: 'Shipping address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fullName, email, address, city, phone } = body.shipping_address;
    
    if (!fullName || fullName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Valid full name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || email.length < 5 || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!address || address.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Valid address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!city || city.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Valid city is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phone || phone.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Valid phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Order must contain at least one item' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.total <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid order total' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SERVER-SIDE PRICE VALIDATION - Prevent price manipulation attacks
    let calculatedSubtotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const item of body.items) {
      if (!item.productId || item.quantity <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid item data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch actual price from database (including variants)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('price, in_stock, name, variants')
        .eq('id', item.productId)
        .single();
        
      if (productError || !product) {
        console.error('Product not found:', item.productId, productError);
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.name || item.productId}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!product.in_stock) {
        return new Response(
          JSON.stringify({ error: `Product "${product.name}" is out of stock` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Determine the correct price to validate against
      const variants = parseVariants(product.variants);
      let expectedPrice = product.price;
      let resolvedVariant: string | undefined = item.variant;

      // If product has variants, try to resolve the correct price
      if (variants.length > 0) {
        if (resolvedVariant) {
          // Variant was provided - try to find it by weight label
          const selectedVariant = variants.find(v => v.weight === resolvedVariant);
          if (selectedVariant) {
            expectedPrice = selectedVariant.price;
            console.log(`Variant price for ${resolvedVariant}: ${expectedPrice}`);
          } else {
            // Variant label doesn't match - try to match by price
            const byPrice = variants.find(v => Math.abs(v.price - item.price) <= 0.01);
            if (byPrice) {
              expectedPrice = byPrice.price;
              resolvedVariant = byPrice.weight;
              console.log(`Resolved variant by price match: ${resolvedVariant} (${expectedPrice})`);
            } else {
              // Use base price as last resort
              console.warn(`Variant "${item.variant}" not found for product ${product.name}, using base price`);
            }
          }
        } else {
          // No variant provided - try to match by submitted price
          const byPrice = variants.find(v => Math.abs(v.price - item.price) <= 0.01);
          if (byPrice) {
            expectedPrice = byPrice.price;
            resolvedVariant = byPrice.weight;
            console.log(`Resolved missing variant by price match: ${resolvedVariant} (${expectedPrice})`);
          } else {
            // No variant match and no price match - use base price
            // This handles products added from shop page without variant selection
            console.log(`No variant match for ${product.name}, using base price: ${product.price}`);
            expectedPrice = product.price;
          }
        }
      }
      // If no variants exist, use base price (already set above)

      // Verify price matches (allow 0.01 tolerance for rounding)
      if (Math.abs(expectedPrice - item.price) > 0.01) {
        console.error('Price mismatch:', { 
          submitted: item.price, 
          expected: expectedPrice, 
          variant: item.variant,
          productName: product.name,
          hasVariants: variants.length > 0
        });
        return new Response(
          JSON.stringify({ error: 'Product prices have changed. Please refresh and try again.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      calculatedSubtotal += expectedPrice * item.quantity;
      validatedItems.push({
        ...item,
        variant: resolvedVariant,
        price: expectedPrice, // Use verified price
        name: resolvedVariant ? `${product.name} (${resolvedVariant})` : product.name, // Include variant in name
      });
    }

    // Verify subtotal matches expected calculation (allow small tolerance)
    if (Math.abs(calculatedSubtotal - body.subtotal) > 0.50) {
      console.error('Subtotal mismatch:', { calculated: calculatedSubtotal, submitted: body.subtotal });
      return new Response(
        JSON.stringify({ error: 'Order total mismatch. Please refresh and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DUPLICATE ORDER PREVENTION
    // Check if an identical order was created in the last 2 minutes (same email, same total, same items count)
    const duplicateCheckEmail = body.shipping_address.email.toLowerCase().trim();
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total, items, created_at')
      .gte('created_at', twoMinutesAgo)
      .eq('total', Number(body.total.toFixed(2)))
      .limit(10);

    if (recentOrders && recentOrders.length > 0) {
      const isDuplicate = recentOrders.some((existing: any) => {
        const existingEmail = existing.items?.[0]?.email || 
          (typeof existing.items === 'object' ? null : null);
        // Check by matching item count and total
        const existingItems = Array.isArray(existing.items) ? existing.items : [];
        return existingItems.length === validatedItems.length;
      });

      // Also check by shipping address email in the orders table
      const { data: recentByEmail } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .gte('created_at', twoMinutesAgo)
        .eq('total', Number(body.total.toFixed(2)))
        .limit(5);
      
      // Filter by shipping_address email (JSONB)
      if (recentByEmail && recentByEmail.length > 0) {
        // We already found a matching order with same total in the last 2 minutes
        // Check if any of them have the same email in shipping_address
        for (const existing of recentByEmail) {
          const { data: fullOrder } = await supabase
            .from('orders')
            .select('shipping_address')
            .eq('id', existing.id)
            .single();
          
          if (fullOrder?.shipping_address?.email?.toLowerCase().trim() === duplicateCheckEmail) {
            console.warn('Duplicate order detected:', { existingId: existing.id, email: duplicateCheckEmail, total: body.total });
            return new Response(
              JSON.stringify({ error: 'A similar order was placed moments ago. Please check your orders before trying again.' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // Create the order with validated data
    const safeCreditsUsed = Math.max(0, Number(body.credits_used || 0));
    const safeVoucherDiscount = Math.max(0, Number(body.voucher_discount || 0));
    const isPickup = (body.courier || '').toLowerCase() === 'pickup';

    let safeShippingCost = Math.max(0, Number(body.shipping_cost || 0));
    let safeCourierCost = Math.max(0, Number(body.courier_cost || 0));
    let safeCourierMarkup = Math.max(0, Number(body.courier_markup || 0));
    let resolvedServiceLevel = normalizeServiceLevel((body.shipping_address as ShippingAddress & { service_level?: string | null }).service_level);

    if (!isPickup) {
      const totalWeight = Math.max(
        validatedItems.reduce((sum, item) => {
          const weight = parseWeightToKg(item.variant) || parseWeightToKg((item as { weight?: string }).weight) || 0.25;
          return sum + weight * item.quantity;
        }, 0),
        1,
      );

      const totalItems = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const parcelsNeeded = Math.max(1, Math.ceil(totalItems / 10));
      const parcelWeight = Number((totalWeight / parcelsNeeded).toFixed(3));

      const ratesResponse = await fetch(`${supabaseUrl}/functions/v1/courier-guy-rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delivery_address: {
            street_address: body.shipping_address.address,
            local_area: body.shipping_address.city,
            city: body.shipping_address.city,
            zone: body.shipping_address.province,
            code: body.shipping_address.postalCode,
            country: 'ZA',
            type: 'residential',
          },
          parcels: Array.from({ length: parcelsNeeded }, () => ({
            submitted_length_cm: 30,
            submitted_width_cm: 25,
            submitted_height_cm: 20,
            submitted_weight_kg: parcelWeight,
          })),
        }),
      });

      const ratesPayload = await ratesResponse.json().catch(() => null);
      const liveRates = Array.isArray(ratesPayload?.rates) ? ratesPayload.rates : [];

      if (!ratesResponse.ok || liveRates.length === 0) {
        const errorMessage = ratesPayload?.error || 'No Courier Guy shipping rates available for this address.';
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const selectedLiveRate = liveRates.find((rate: any) => rate.service_level?.code === resolvedServiceLevel) || liveRates[0];

      safeShippingCost = Math.max(0, Number(selectedLiveRate?.rate || 0));
      safeCourierCost = Math.max(0, Number(selectedLiveRate?.original_rate || 0));
      safeCourierMarkup = Math.max(0, Number(selectedLiveRate?.markup || 0));
      resolvedServiceLevel = normalizeServiceLevel(selectedLiveRate?.service_level?.code) || resolvedServiceLevel;
    }

    const productTax = Number(validatedItems.reduce((sum, item) => {
      if (isZeroRated(item.name)) return sum;
      const lineTotalExcl = Number((item.price * item.quantity).toFixed(2));
      return sum + Number((lineTotalExcl * VAT_RATE).toFixed(2));
    }, 0).toFixed(2));
    const shippingTax = isPickup ? 0 : Number((safeShippingCost * VAT_RATE).toFixed(2));
    const calculatedTax = Number((productTax + shippingTax).toFixed(2));

    const orderTotal = Number((calculatedSubtotal + safeShippingCost + calculatedTax - safeCreditsUsed - safeVoucherDiscount).toFixed(2));
    const orderData = {
      user_id: body.user_id || null,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      shipping_cost: safeShippingCost,
      total: Number(orderTotal.toFixed(2)),
      credits_used: safeCreditsUsed,
      voucher_code: body.voucher_code || null,
      voucher_discount: safeVoucherDiscount,
      courier: body.courier || null,
      courier_cost: safeCourierCost,
      courier_markup: safeCourierMarkup,
      shipping_address: {
        ...body.shipping_address,
        service_level: resolvedServiceLevel,
      },
      status: 'pending',
      items: validatedItems,
    };

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Unable to process order. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created successfully:', order.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: order 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-order function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to parse variants from product data
function parseVariants(v: unknown): ProductVariant[] {
  if (!v) return [];
  try {
    const parsed = Array.isArray(v) ? v : JSON.parse(v as string);
    if (!Array.isArray(parsed)) return [];

    // Backward compat: some older dashboard edits stored { size, price }
    return parsed
      .map((x: Record<string, unknown>) => ({
        weight: String((x as any).weight ?? (x as any).size ?? ""),
        price: Number((x as any).price ?? 0),
      }))
      .filter((x) => x.weight && Number.isFinite(x.price) && x.price > 0);
  } catch {
    return [];
  }
}
