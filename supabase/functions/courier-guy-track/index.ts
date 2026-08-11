import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COURIER_GUY_API_URL = 'https://api.portal.thecourierguy.co.za/v2/tracking';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('COURIER_GUY_API_KEY');
    
    if (!apiKey) {
      console.error('COURIER_GUY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Courier service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { waybill } = await req.json();

    if (!waybill) {
      return new Response(
        JSON.stringify({ error: 'Missing waybill number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tracking shipment:', waybill);

    // Get tracking events
    const response = await fetch(`${COURIER_GUY_API_URL}/${waybill}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Courier Guy tracking error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to get tracking info' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Courier Guy tracking response:', JSON.stringify(data));

    // Format tracking events for display
    const events = data.events?.map((event: any) => ({
      date: event.date || event.created_at,
      status: event.status || event.description,
      location: event.location || event.hub_name || '',
      description: event.description || event.status
    })) || [];

    // Determine current status
    let currentStatus = 'pending';
    if (data.status) {
      const statusLower = data.status.toLowerCase();
      if (statusLower.includes('delivered')) {
        currentStatus = 'delivered';
      } else if (statusLower.includes('transit') || statusLower.includes('out for delivery')) {
        currentStatus = 'shipped';
      } else if (statusLower.includes('collected') || statusLower.includes('processing')) {
        currentStatus = 'processing';
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        waybill: waybill,
        status: currentStatus,
        courier_status: data.status || 'Unknown',
        events: events,
        estimated_delivery: data.estimated_delivery_date || null,
        tracking_url: `https://thecourierguy.co.za/tracking/?waybill=${waybill}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error tracking shipment:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get tracking info' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
