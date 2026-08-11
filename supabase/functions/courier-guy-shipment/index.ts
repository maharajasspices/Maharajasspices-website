import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COURIER_GUY_API_URL = 'https://api.portal.thecourierguy.co.za/v2/shipments';
const COURIER_GUY_RATES_URL = 'https://api.portal.thecourierguy.co.za/v2/rates';
const MARKUP_PERCENTAGE = 0.10;
const MAX_PARCEL_DESCRIPTION_LENGTH = 240;
const SHIPMENT_LOCK_TIMEOUT_MS = 10 * 60 * 1000;

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

const cityZoneMap: Record<string, string> = {
  'durban': 'KwaZulu-Natal', 'johannesburg': 'Gauteng', 'pretoria': 'Gauteng',
  'cape town': 'Western Cape', 'port elizabeth': 'Eastern Cape', 'gqeberha': 'Eastern Cape',
  'bloemfontein': 'Free State', 'pietermaritzburg': 'KwaZulu-Natal', 'east london': 'Eastern Cape',
  'mbombela': 'Mpumalanga', 'nelspruit': 'Mpumalanga', 'polokwane': 'Limpopo',
  'kimberley': 'Northern Cape', 'mahikeng': 'North West', 'rustenburg': 'North West',
  'stellenbosch': 'Western Cape', 'paarl': 'Western Cape', 'george': 'Western Cape',
  'richards bay': 'KwaZulu-Natal', 'newcastle': 'KwaZulu-Natal', 'verulam': 'KwaZulu-Natal',
  'hillcrest': 'KwaZulu-Natal', 'centurion': 'Gauteng', 'sandton': 'Gauteng',
  'randburg': 'Gauteng', 'benoni': 'Gauteng', 'boksburg': 'Gauteng',
};

const VALID_SERVICE_LEVELS = ['ECO', 'ECOR', 'OVN', 'OVNR', 'LOX', 'LOF'];
const SERVICE_LEVEL_ALIASES: Record<string, string> = {
  ECONOMY: 'ECO',
  ECOLOCAL: 'ECO',
  OVERNIGHT: 'OVN',
};

function normalizeServiceLevel(serviceLevel?: string | null): string {
  if (!serviceLevel) return 'ECO';
  const normalized = serviceLevel.trim().toUpperCase();
  return SERVICE_LEVEL_ALIASES[normalized] || normalized;
}

function truncateText(value: string, maxLength = MAX_PARCEL_DESCRIPTION_LENGTH): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function safeJsonParse<T>(value: string): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeItemLabel(item: any): string | null {
  const name = String(item?.name || '').trim();
  if (!name) return null;

  const variant = String(item?.variant || item?.weight || '').trim();
  if (!variant) return name;

  return name.toLowerCase().includes(variant.toLowerCase()) ? name : `${name} (${variant})`;
}

function buildParcelDescriptions(items: any[], parcelCount: number, orderId: string): string[] {
  const safeParcelCount = Math.max(parcelCount, 1);
  const expandedLabels: string[] = [];

  for (const item of items || []) {
    const label = normalizeItemLabel(item);
    if (!label) continue;

    const quantity = Math.max(Number(item?.quantity || 1), 1);
    for (let index = 0; index < quantity; index += 1) {
      expandedLabels.push(label);
    }
  }

  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  if (expandedLabels.length === 0) {
    return Array.from({ length: safeParcelCount }, (_, index) => `Order ${shortOrderId} - Parcel ${index + 1}`);
  }

  const chunkSize = Math.ceil(expandedLabels.length / safeParcelCount);
  return Array.from({ length: safeParcelCount }, (_, index) => {
    const chunk = expandedLabels.slice(index * chunkSize, (index + 1) * chunkSize);
    const summary = chunk.length ? chunk.join(', ') : `Parcel ${index + 1}`;
    return truncateText(`Order ${shortOrderId}: ${summary}`);
  });
}

async function createShipment(apiKey: string, shipmentRequest: any): Promise<{ response: Response; responseText: string; data: any | null }> {
  const response = await fetch(COURIER_GUY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shipmentRequest),
  });

  const responseText = await response.text();
  const data = safeJsonParse<any>(responseText);
  return { response, responseText, data };
}

type ShipmentLockResult =
  | { ok: true; lockTimestamp: string }
  | { ok: false; reason: 'missing_order' | 'already_exists' | 'in_progress'; waybill?: string; startedAt?: string | null };

async function claimShipmentLock(supabase: any, orderId: string): Promise<ShipmentLockResult> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, courier_waybill, shipment_creation_started_at')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  if (!order) return { ok: false, reason: 'missing_order' };
  if (order.courier_waybill) {
    return { ok: false, reason: 'already_exists', waybill: order.courier_waybill };
  }

  const startedAt = order.shipment_creation_started_at;
  if (startedAt) {
    const lockAge = Date.now() - new Date(startedAt).getTime();
    if (Number.isFinite(lockAge) && lockAge < SHIPMENT_LOCK_TIMEOUT_MS) {
      return { ok: false, reason: 'in_progress', startedAt };
    }
  }

  const lockTimestamp = new Date().toISOString();
  let updateQuery = supabase
    .from('orders')
    .update({
      shipment_creation_started_at: lockTimestamp,
      shipment_creation_error: null,
    })
    .eq('id', orderId)
    .is('courier_waybill', null);

  updateQuery = startedAt
    ? updateQuery.eq('shipment_creation_started_at', startedAt)
    : updateQuery.is('shipment_creation_started_at', null);

  const { data: claimedOrder, error: claimError } = await updateQuery
    .select('id')
    .maybeSingle();

  if (claimError) throw claimError;
  if (claimedOrder) return { ok: true, lockTimestamp };

  const { data: currentOrder, error: currentOrderError } = await supabase
    .from('orders')
    .select('courier_waybill, shipment_creation_started_at')
    .eq('id', orderId)
    .maybeSingle();

  if (currentOrderError) throw currentOrderError;
  if (currentOrder?.courier_waybill) {
    return { ok: false, reason: 'already_exists', waybill: currentOrder.courier_waybill };
  }

  return {
    ok: false,
    reason: 'in_progress',
    startedAt: currentOrder?.shipment_creation_started_at || startedAt || null,
  };
}

async function clearShipmentLock(supabase: any, orderId: string, lockTimestamp: string, errorMessage?: string | null) {
  const { error } = await supabase
    .from('orders')
    .update({
      shipment_creation_started_at: null,
      shipment_creation_error: errorMessage || null,
    })
    .eq('id', orderId)
    .eq('shipment_creation_started_at', lockTimestamp);

  if (error) {
    console.error(`Failed to clear shipment lock for order ${orderId}:`, error);
  }
}

async function finalizeShipmentLock(
  supabase: any,
  orderId: string,
  lockTimestamp: string,
  updates: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('orders')
    .update({
      ...updates,
      shipment_creation_started_at: null,
      shipment_creation_error: null,
    })
    .eq('id', orderId)
    .eq('shipment_creation_started_at', lockTimestamp);

  if (error) {
    console.error(`Failed to finalize shipment lock for order ${orderId}:`, error);
  }
}

function getCourierErrorMessage(data: any, responseText: string, fallback = 'Failed to create shipment'): string {
  return data?.message || data?.error || responseText.trim() || fallback;
}

function isServiceLevelError(data: any, responseText: string): boolean {
  return getCourierErrorMessage(data, responseText).toLowerCase().includes('could not find rates for the requested service level code');
}

function getFallbackServiceLevels(rates: any[], preferredCode: string): string[] {
  const preferred = normalizeServiceLevel(preferredCode);
  const candidates: string[] = [];

  for (const rate of rates) {
    const code = rate?.service_level?.code ? normalizeServiceLevel(rate.service_level.code) : null;
    if (code && code !== preferred && !candidates.includes(code)) {
      candidates.push(code);
    }
  }

  for (const code of VALID_SERVICE_LEVELS) {
    if (code !== preferred && !candidates.includes(code)) {
      candidates.push(code);
    }
  }

  return candidates;
}

async function fetchAvailableRates(apiKey: string, shipmentRequest: any): Promise<any[]> {
  const rateRequest = {
    collection_address: shipmentRequest.collection_address,
    delivery_address: shipmentRequest.delivery_address,
    parcels: shipmentRequest.parcels,
  };

  const response = await fetch(COURIER_GUY_RATES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rateRequest),
  });

  const responseText = await response.text();
  const data = safeJsonParse<any>(responseText) || {};

  if (!response.ok) {
    throw new Error(getCourierErrorMessage(data, responseText, 'Failed to fetch fallback rates'));
  }

  return Array.isArray(data?.rates) ? data.rates : [];
}

function pickFallbackServiceLevel(rates: any[], preferredCode: string): string | null {
  if (!rates.length) return null;

  const normalizedPreferred = normalizeServiceLevel(preferredCode);
  const preferred = rates.find((rate) => normalizeServiceLevel(rate?.service_level?.code) === normalizedPreferred);
  if (preferred?.service_level?.code) {
    return normalizeServiceLevel(preferred.service_level.code);
  }

  const firstValid = rates.find((rate) => rate?.service_level?.code);
  return firstValid?.service_level?.code ? normalizeServiceLevel(firstValid.service_level.code) : null;
}

interface ShipmentRequest {
  order_id: string;
  delivery_address: {
    fullName: string;
    address: string;
    city: string;
    suburb?: string;
    province?: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  parcels: Array<{
    weight_kg: number;
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
    parcel_description?: string;
    alternative_tracking_reference?: string;
  }>;
  order_items?: Array<{
    name?: string;
    quantity?: number;
    variant?: string;
    weight?: string;
  }>;
  service_level: string;
  rate: number;
  original_rate: number;
}

async function sendTrackingEmail(
  customerEmail: string,
  _customerName: string,
  orderId: string,
  waybill: string,
  _supabaseUrl: string,
  _supabaseServiceKey: string
): Promise<void> {
  // Email provider removed. Stub kept so shipment creation continues to succeed.
  console.log(`[tracking email] skipped for ${customerEmail} (order ${orderId}, waybill ${waybill}) — no email provider configured.`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase: any = null;
  let activeOrderId: string | null = null;
  let shipmentLockTimestamp: string | null = null;

  try {
    const apiKey = Deno.env.get('COURIER_GUY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!apiKey) {
      console.error('COURIER_GUY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Courier service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { order_id, delivery_address, parcels, order_items = [], service_level, rate, original_rate }: ShipmentRequest = await req.json();
    activeOrderId = order_id;

    if (!order_id || !delivery_address || !parcels || !service_level) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lockResult = await claimShipmentLock(supabase, order_id);
    if (!lockResult.ok) {
      if (lockResult.reason === 'missing_order') {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (lockResult.reason === 'already_exists') {
        return new Response(
          JSON.stringify({ success: true, waybill: lockResult.waybill, message: 'Shipment already exists' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Shipment creation already in progress',
          started_at: lockResult.startedAt,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    shipmentLockTimestamp = lockResult.lockTimestamp;

    const cityLower = (delivery_address.city || '').toLowerCase();
    const zone = delivery_address.province || cityZoneMap[cityLower] || 'KwaZulu-Natal';

    const validServiceLevel = normalizeServiceLevel(service_level);
    if (validServiceLevel !== service_level?.trim().toUpperCase()) {
      console.log(`Normalized service level from "${service_level}" to "${validServiceLevel}"`);
    }

    const now = new Date();
    const minDate = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const parcelDescriptions = buildParcelDescriptions(order_items, parcels.length, order_id);

    const shipmentRequest = {
      collection_address: COLLECTION_ADDRESS,
      collection_contact: COLLECTION_CONTACT,
      delivery_address: {
        type: "residential",
        company: "",
        street_address: delivery_address.address,
        local_area: delivery_address.suburb || delivery_address.city,
        city: delivery_address.city,
        zone,
        country: "ZA",
        code: delivery_address.postalCode || "0000"
      },
      delivery_contact: {
        name: delivery_address.fullName,
        mobile_number: delivery_address.phone,
        email: delivery_address.email
      },
      parcels: parcels.map((p: any, index: number) => ({
        parcel_description: truncateText((p as any).parcel_description || parcelDescriptions[index] || `Order ${order_id.substring(0, 8).toUpperCase()} - Parcel ${index + 1}`),
        submitted_length_cm: p.length_cm || 20,
        submitted_width_cm: p.width_cm || 20,
        submitted_height_cm: p.height_cm || 15,
        submitted_weight_kg: p.weight_kg || 1,
        alternative_tracking_reference: (p as any).alternative_tracking_reference || `${order_id.substring(0, 8)}-P${index + 1}`
      })),
      customer_reference_name: "Order no.",
      customer_reference: order_id.substring(0, 8).toUpperCase(),
      service_level_code: validServiceLevel,
      collection_min_date: minDate,
      collection_after: "08:00",
      collection_before: "16:00",
      mute_notifications: false
    };

    console.log('Creating shipment with Courier Guy:', JSON.stringify(shipmentRequest));

    let { response, responseText, data } = await createShipment(apiKey, shipmentRequest);

    if (!response.ok) {
      const shouldRetryWithFallback = isServiceLevelError(data, responseText);

      if (shouldRetryWithFallback) {
        try {
          const fallbackRates = await fetchAvailableRates(apiKey, shipmentRequest);
          const fallbackServiceLevels = [
            pickFallbackServiceLevel(fallbackRates, validServiceLevel),
            ...getFallbackServiceLevels(fallbackRates, validServiceLevel),
          ].filter((code, index, all): code is string => Boolean(code) && all.indexOf(code) === index);

          for (const fallbackServiceLevel of fallbackServiceLevels) {
            if (fallbackServiceLevel === shipmentRequest.service_level_code) continue;

            console.log(`Retrying shipment with fallback service level ${fallbackServiceLevel} instead of ${shipmentRequest.service_level_code}`);
            shipmentRequest.service_level_code = fallbackServiceLevel;

            const attempt = await createShipment(apiKey, shipmentRequest);
            response = attempt.response;
            responseText = attempt.responseText;
            data = attempt.data;

            if (response.ok) {
              break;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback shipment retry failed:', fallbackError);
        }
      }
    }

    if (!response.ok) {
      console.error('Courier Guy shipment error:', JSON.stringify(data || responseText));
      await clearShipmentLock(supabase, order_id, shipmentLockTimestamp, getCourierErrorMessage(data, responseText));
      return new Response(
        JSON.stringify({
          error: getCourierErrorMessage(data, responseText),
          details: data?.shipments?.[0]?.errors || data?.errors || responseText || null,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      console.error('Courier Guy returned a successful response without JSON:', responseText.substring(0, 500));
      await clearShipmentLock(supabase, order_id, shipmentLockTimestamp, 'Courier Guy returned invalid success response');
      return new Response(
        JSON.stringify({ error: 'Courier Guy returned invalid success response', details: responseText.substring(0, 200) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Courier Guy shipment created:', JSON.stringify(data));

    const waybill = data?.shipments?.[0]?.tracking_reference || data?.shipments?.[0]?.short_tracking_reference || data.short_tracking_reference || data.tracking_reference || data.id;
    const markup = Number((original_rate * MARKUP_PERCENTAGE).toFixed(2));
    const trackingUrl = `https://thecourierguy.co.za/tracking/?waybill=${waybill}`;

    // Update order with courier details
    await finalizeShipmentLock(supabase, order_id, shipmentLockTimestamp, {
      courier_waybill: waybill,
      courier_cost: original_rate || Number((rate / (1 + MARKUP_PERCENTAGE)).toFixed(2)),
      courier_markup: markup,
      courier: 'The Courier Guy',
      status: 'processing',
    });

    // Send tracking email to customer and CC to marketing
    if (delivery_address.email) {
      await sendTrackingEmail(
        delivery_address.email,
        delivery_address.fullName || 'Customer',
        order_id,
        waybill,
        supabaseUrl,
        supabaseServiceKey
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        waybill: waybill,
        tracking_url: trackingUrl,
        shipment: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating shipment:', error);

    if (supabase && activeOrderId && shipmentLockTimestamp) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create shipment';
      await clearShipmentLock(supabase, activeOrderId, shipmentLockTimestamp, errorMessage);
    }

    return new Response(
      JSON.stringify({ error: 'Failed to create shipment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
