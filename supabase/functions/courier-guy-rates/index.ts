import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COURIER_GUY_API_URL = 'https://api.portal.thecourierguy.co.za/v2/rates';
const MARKUP_PERCENTAGE = 0.10; // 10% markup
const SERVICE_LEVEL_ALIASES: Record<string, string> = {
  ECONOMY: 'ECO',
  ECOLOCAL: 'ECO',
  OVERNIGHT: 'OVN',
};

function safeJsonParse<T>(value: string): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeServiceLevel(code?: string | null): string {
  if (!code) return 'ECO';
  const normalized = code.trim().toUpperCase();
  return SERVICE_LEVEL_ALIASES[normalized] || normalized;
}

// Our Collection Address, If they would like to collect instead of doing a pickup.
const COLLECTION_ADDRESS = {
  type: "business",
  company: "Maharaja's Spices",
  street_address: "Nguni Business Park, Factory 4, 1 Nguni Way",
  local_area: "Hillcrest",
  city: "Hillcrest",
  zone: "KwaZulu-Natal",
  country: "ZA",
  code: "3650"
};

const COLLECTION_CONTACT = {
  name: "Maharaja's Spices",
  mobile_number: "+27684051374",
  email: "e-commerce@maharajasspices.co.za"
};

interface RateRequest {
  delivery_address: {
    street_address: string;
    local_area: string;
    city: string;
    zone: string;
    code: string;
    country?: string;
    type?: string;
  };
  parcels: Array<{
    submitted_length_cm: number;
    submitted_width_cm: number;
    submitted_height_cm: number;
    submitted_weight_kg: number;
  }>;
}

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

    const { delivery_address, parcels }: RateRequest = await req.json();

    if (!delivery_address || !parcels || parcels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing delivery address or parcels' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the request body for Courier Guy API
    const requestBody = {
      collection_address: COLLECTION_ADDRESS,
      delivery_address: {
        type: delivery_address.type || "residential",
        street_address: delivery_address.street_address,
        local_area: delivery_address.local_area || delivery_address.city,
        city: delivery_address.city,
        zone: delivery_address.zone,
        country: delivery_address.country || "ZA",
        code: delivery_address.code
      },
      parcels: parcels.map(p => ({
        parcel_description: "Spices",
        submitted_length_cm: p.submitted_length_cm || 20,
        submitted_width_cm: p.submitted_width_cm || 20,
        submitted_height_cm: p.submitted_height_cm || 15,
        submitted_weight_kg: p.submitted_weight_kg || 1
      }))
    };

    console.log('Requesting rates from Courier Guy:', JSON.stringify(requestBody));

    const response = await fetch(COURIER_GUY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    const data = safeJsonParse<any>(responseText) || {};

    if (!response.ok) {
      console.error('Courier Guy API error:', data || responseText);
      return new Response(
        JSON.stringify({ error: data?.message || responseText || 'Failed to get shipping rates' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Courier Guy rates response:', JSON.stringify(data));

    // Process rates and apply 25% markup
    const processedRates = data.rates?.map((rate: any) => {
      const originalRate = rate.rate || 0;
      const markup = originalRate * MARKUP_PERCENTAGE;
      const finalRate = originalRate + markup;

      return {
        service_level: {
          ...(rate.service_level || {}),
          code: normalizeServiceLevel(rate.service_level?.code),
        },
        original_rate: originalRate,
        markup: markup,
        rate: Math.round(finalRate * 100) / 100, // Round to 2 decimal places
        base_rate: rate.base_rate,
        surcharges: rate.surcharges || [],
        delivery_days: rate.time_based_rates?.[0]?.delivery_date_from || "2-5 business days"
      };
    }) || [];

    if (processedRates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No shipping rates available for this address' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        rates: processedRates,
        service_days: data.service_days
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting courier rates:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get shipping rates' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
