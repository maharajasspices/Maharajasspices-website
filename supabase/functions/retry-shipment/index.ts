import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KG_REGEX = /([\d.]+)\s*kg/i;
const G_REGEX = /([\d.]+)\s*g/i;
const ML_REGEX = /([\d.]+)\s*ml/i;
const L_REGEX = /([\d.]+)\s*l/i;
const SERVICE_LEVEL_ALIASES: Record<string, string> = {
  ECONOMY: 'ECO',
  ECOLOCAL: 'ECO',
  OVERNIGHT: 'OVN',
};

function parseWeightToKg(value?: string | null): number {
  if (!value) return 0;
  const v = value.trim();
  const kg = v.match(KG_REGEX);
  if (kg) return Number(kg[1]);
  const g = v.match(G_REGEX);
  if (g) return Number(g[1]) / 1000;
  const ml = v.match(ML_REGEX);
  if (ml) return Number(ml[1]) / 1000;
  const l = v.match(L_REGEX);
  if (l) return Number(l[1]);
  return 0;
}

function normalizeServiceLevel(value?: string | null): string {
  if (!value) return 'ECO';
  const normalized = value.trim().toUpperCase();
  return SERVICE_LEVEL_ALIASES[normalized] || normalized;
}

function truncateText(value: string, maxLength = 240): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.courier_waybill) {
      return new Response(JSON.stringify({ success: true, waybill: order.courier_waybill, message: 'Shipment already exists' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.courier?.toLowerCase() === 'pickup') {
      return new Response(JSON.stringify({ error: 'Pickup order - no shipment required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const addr = order.shipping_address || {};
    const items = Array.isArray(order.items) ? order.items : [];

    const productIds = items
      .map((i: any) => i.productId || i.product_id)
      .filter(Boolean);

    const { data: products } = productIds.length
      ? await supabase
          .from('products')
          .select('id, weight')
          .in('id', productIds)
      : { data: [] as any[] };

    const productWeightMap = new Map((products || []).map((p: any) => [p.id, p.weight]));

    let totalWeightKg = 0;
    for (const item of items) {
      const qty = Number(item.quantity || 1);
      const rawWeight =
        item.weight ||
        item.variant ||
        productWeightMap.get(item.productId || item.product_id) ||
        item.name ||
        '';

      const parsed = parseWeightToKg(rawWeight);
      const itemWeight = parsed > 0 ? parsed : 0.25;
      totalWeightKg += itemWeight * qty;
    }

    totalWeightKg = Math.max(totalWeightKg, 0.5);

    const totalItems = items.reduce((sum: number, i: any) => sum + Number(i.quantity || 1), 0);
    const parcelsNeeded = Math.max(1, Math.ceil(totalItems / 10));

    const parcelWeight = Number((totalWeightKg / parcelsNeeded).toFixed(3));
    const parcelDescriptions = buildParcelDescriptions(items, parcelsNeeded, order_id);
    const parcels = Array.from({ length: parcelsNeeded }, (_, index) => ({
      weight_kg: parcelWeight,
      length_cm: 30,
      width_cm: 25,
      height_cm: 20,
      parcel_index: index + 1,
      parcel_description: parcelDescriptions[index],
    }));

    const VALID_LEVELS = ['ECO', 'OVN', 'LOX', 'LOF'];
    const rawLevel = normalizeServiceLevel(addr.service_level || 'ECO');
    const serviceLevel = VALID_LEVELS.includes(rawLevel) ? rawLevel : 'ECO';
    const orderShippingCost = Number(order.shipping_cost || 0);
    const originalRate = Number(order.courier_cost && order.courier_cost > 0 ? order.courier_cost : orderShippingCost);

    const shipmentBody = {
      order_id: order.id,
      delivery_address: {
        fullName: addr.fullName || 'Customer',
        address: addr.address,
        city: addr.city,
        suburb: addr.suburb || addr.city,
        province: addr.province || 'KwaZulu-Natal',
        postalCode: addr.postalCode || '0000',
        phone: addr.phone || '',
        email: addr.email || '',
      },
      parcels,
      order_items: items,
      service_level: serviceLevel,
      rate: orderShippingCost,
      original_rate: originalRate,
    };

    console.log('Retry shipment payload:', JSON.stringify(shipmentBody));

    // Use a unique tracking ref with timestamp to avoid conflicts on retry
    const timestamp = Date.now().toString(36);
    shipmentBody.parcels = shipmentBody.parcels.map((p: any, i: number) => ({
      ...p,
      alternative_tracking_reference: `${order_id.substring(0, 6)}-${timestamp}-P${i + 1}`,
    }));

    const response = await fetch(`${supabaseUrl}/functions/v1/courier-guy-shipment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentBody),
    });

    const result = await response.json();
    console.log('Retry shipment response:', JSON.stringify(result));

    if (!response.ok || result?.success !== true) {
      if (response.status === 409 && result?.error === 'Shipment creation already in progress') {
        return new Response(JSON.stringify({
          error: result.error,
          started_at: result.started_at || null,
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if the error is about duplicate tracking ref - means shipment already exists
      const details = result?.details || result?.raw?.details || '';
      const detailStr = typeof details === 'string' ? details : JSON.stringify(details);
      if (detailStr.includes('not unique') || detailStr.includes('already exists')) {
        return new Response(JSON.stringify({
          error: 'Shipment already exists on Courier Guy. Please restore the waybill manually in the admin dashboard.',
          details: detailStr,
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        error: result?.error || 'Failed to create shipment',
        details: result?.details || null,
        raw: result,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'pending' || order.status === 'paid') {
      await supabase.from('orders').update({ status: 'processing' }).eq('id', order_id);
    }

    // Also create invoice if none exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    if (!existingInvoice) {
      console.log('No invoice found for order, triggering invoice creation via payfast-notify would be needed');
    }

    return new Response(JSON.stringify({ success: true, order_id, ...result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Retry shipment error:', error);
    return new Response(JSON.stringify({ error: 'Failed to retry shipment' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
