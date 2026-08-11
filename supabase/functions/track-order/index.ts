import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackOrderRequest {
  tracking_token: string;
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_token, email } = await req.json() as TrackOrderRequest;

    // Validate inputs
    if (!tracking_token || !email) {
      return new Response(
        JSON.stringify({ error: 'Tracking token and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tracking_token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tracking token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with matching token AND email (server-side validation)
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, created_at, total, courier, shipping_address, items')
      .eq('tracking_token', tracking_token)
      .is('user_id', null)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order) {
      console.log('Order not found for token:', tracking_token.substring(0, 8) + '...');
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email matches - THIS IS THE CRITICAL SECURITY CHECK
    const shippingAddress = order.shipping_address as Record<string, string>;
    const orderEmail = shippingAddress?.email?.toLowerCase();
    
    if (!orderEmail || orderEmail !== email.toLowerCase()) {
      console.log('Email mismatch for order tracking attempt');
      return new Response(
        JSON.stringify({ error: 'Email does not match the order' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return sanitized order data (excluding sensitive internal fields)
    const sanitizedOrder = {
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      total: order.total,
      courier: order.courier,
      shipping_address: {
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
      },
      items: order.items,
    };

    console.log('Order tracked successfully:', order.id);

    return new Response(
      JSON.stringify({ order: sanitizedOrder }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Track order error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
