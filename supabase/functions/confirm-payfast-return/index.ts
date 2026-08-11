import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAT_RATE = 0.15;
const ZERO_RATED_KEYWORDS = [
  "sugar beans",
  "white rice",
  "masoor",
  "breyani dhall",
  "raw nuts",
  "nuts",
  "pea dhall",
];
const KG_REGEX = /([\d.]+)\s*kg/i;
const G_REGEX = /([\d.]+)\s*g/i;
const ML_REGEX = /([\d.]+)\s*ml/i;
const L_REGEX = /([\d.]+)\s*l/i;

function normalizeServiceLevel(serviceLevel?: string | null): string {
  if (!serviceLevel) return "ECO";

  const normalized = serviceLevel.trim().toUpperCase();
  const aliases: Record<string, string> = {
    ECONOMY: "ECO",
    ECOLOCAL: "ECO",
    OVERNIGHT: "OVN",
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

function isZeroRated(itemName: string): boolean {
  const lowerName = itemName.toLowerCase();
  return ZERO_RATED_KEYWORDS.some((keyword) => lowerName.includes(keyword));
}

function truncateText(value: string, maxLength = 240): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeItemLabel(item: any): string | null {
  const name = String(item?.name || "").trim();
  if (!name) return null;

  const variant = String(item?.variant || item?.weight || "").trim();
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
    const summary = chunk.length ? chunk.join(", ") : `Parcel ${index + 1}`;
    return truncateText(`Order ${shortOrderId}: ${summary}`);
  });
}

function calculateVatBreakdown(unitPriceExclVat: number, quantity: number, itemName = "") {
  const lineTotalExcl = Number((unitPriceExclVat * quantity).toFixed(2));
  const zeroRated = isZeroRated(itemName);
  const lineVat = zeroRated ? 0 : Number((lineTotalExcl * VAT_RATE).toFixed(2));
  const lineTotalIncl = Number((lineTotalExcl + lineVat).toFixed(2));
  const unitVat = zeroRated ? 0 : Number((unitPriceExclVat * VAT_RATE).toFixed(2));
  const unitPriceIncl = Number((unitPriceExclVat + unitVat).toFixed(2));
  return {
    unit_price_incl: unitPriceIncl,
    unit_price_excl: unitPriceExclVat,
    unit_vat: unitVat,
    line_total_incl: lineTotalIncl,
    line_total_excl: lineTotalExcl,
    line_vat: lineVat,
    is_zero_rated: zeroRated,
  };
}

async function generateInvoiceNumber(supabase: any): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data, error } = await supabase.rpc("nextval", { seq_name: "invoice_number_seq" });
  const seqNum = error || !data ? Math.floor(Date.now() / 1000) % 100000 : parseInt(data, 10);
  return `INV-${yearMonth}-${String(seqNum).padStart(5, "0")}`;
}

async function createInvoice(orderId: string, orderData: any, supabase: any): Promise<void> {
  const shippingAddress = orderData.shipping_address || {};
  const items = orderData.items || [];
  const lineItems: any[] = [];
  let subtotalExclVat = 0;
  let totalVat = 0;
  let totalInclVat = 0;

  for (const item of items) {
    const vatBreakdown = calculateVatBreakdown(Number(item.price || 0), Number(item.quantity || 0), item.name);
    lineItems.push({
      product_id: item.productId || item.product_id || null,
      name: vatBreakdown.is_zero_rated ? `${item.name} (Zero-Rated)` : item.name,
      quantity: item.quantity,
      ...vatBreakdown,
    });
    subtotalExclVat += vatBreakdown.line_total_excl;
    totalVat += vatBreakdown.line_vat;
    totalInclVat += vatBreakdown.line_total_incl;
  }

  if (orderData.shipping_cost && orderData.shipping_cost > 0) {
    const isPickup = orderData.courier?.toLowerCase() === "pickup";
    const shippingVatBreakdown = calculateVatBreakdown(Number(orderData.shipping_cost), 1, isPickup ? "pickup" : "shipping");
    lineItems.push({
      product_id: null,
      name: `Shipping - ${orderData.courier || "Standard Delivery"}`,
      quantity: 1,
      ...shippingVatBreakdown,
    });
    subtotalExclVat += shippingVatBreakdown.line_total_excl;
    totalVat += shippingVatBreakdown.line_vat;
    totalInclVat += shippingVatBreakdown.line_total_incl;
  }

  const voucherDiscount = Number(orderData.voucher_discount || 0);
  if (voucherDiscount > 0) {
    lineItems.push({
      product_id: null,
      name: `Voucher Discount${orderData.voucher_code ? ` (${orderData.voucher_code})` : ""}`,
      quantity: 1,
      unit_price_incl: -voucherDiscount,
      unit_price_excl: -voucherDiscount,
      unit_vat: 0,
      line_total_incl: -voucherDiscount,
      line_total_excl: -voucherDiscount,
      line_vat: 0,
      is_zero_rated: true,
    });
    subtotalExclVat -= voucherDiscount;
    totalInclVat -= voucherDiscount;
  }

  const creditsUsed = Number(orderData.credits_used || 0);
  if (creditsUsed > 0) {
    lineItems.push({
      product_id: null,
      name: "M-Wallet Credits Applied",
      quantity: 1,
      unit_price_incl: -creditsUsed,
      unit_price_excl: -creditsUsed,
      unit_vat: 0,
      line_total_incl: -creditsUsed,
      line_total_excl: -creditsUsed,
      line_vat: 0,
      is_zero_rated: true,
    });
    subtotalExclVat -= creditsUsed;
    totalInclVat -= creditsUsed;
  }

  subtotalExclVat = Number(subtotalExclVat.toFixed(2));
  totalVat = Number(totalVat.toFixed(2));
  totalInclVat = Number(totalInclVat.toFixed(2));

  const expectedPaidTotal = Number(Number(orderData.total || 0).toFixed(2));
  const roundingDelta = Number((expectedPaidTotal - totalInclVat).toFixed(2));
  if (Math.abs(roundingDelta) >= 0.01) {
    lineItems.push({
      product_id: null,
      name: "Rounding Adjustment",
      quantity: 1,
      unit_price_incl: roundingDelta,
      unit_price_excl: roundingDelta,
      unit_vat: 0,
      line_total_incl: roundingDelta,
      line_total_excl: roundingDelta,
      line_vat: 0,
      is_zero_rated: true,
    });
    subtotalExclVat = Number((subtotalExclVat + roundingDelta).toFixed(2));
    totalInclVat = Number((totalInclVat + roundingDelta).toFixed(2));
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("order_id", orderId)
    .maybeSingle();

  const invoiceNumber = existingInvoice?.invoice_number || await generateInvoiceNumber(supabase);
  const invoicePayload = {
    order_id: orderId,
    user_id: orderData.user_id || null,
    invoice_number: invoiceNumber,
    customer_name: shippingAddress.fullName || "Customer",
    customer_email: shippingAddress.email || null,
    customer_phone: shippingAddress.phone || null,
    customer_address: shippingAddress,
    line_items: lineItems,
    subtotal_excl_vat: subtotalExclVat,
    total_vat: totalVat,
    total_incl_vat: totalInclVat,
    vat_rate: VAT_RATE * 100,
    payment_reference: null,
  };

  const query = existingInvoice
    ? supabase.from("invoices").update(invoicePayload).eq("id", existingInvoice.id)
    : supabase.from("invoices").insert(invoicePayload);

  const { error: invoiceError } = await query;
  if (invoiceError) throw invoiceError;
}

async function createCourierGuyShipment(orderId: string, orderData: any): Promise<any> {
  if (!orderData.courier || orderData.courier.toLowerCase() === "pickup") {
    return { skipped: true, reason: "pickup" };
  }

  if (orderData.courier_waybill) {
    return { success: true, waybill: orderData.courier_waybill, existing: true };
  }

  const shippingAddress = orderData.shipping_address || {};
  if (!shippingAddress.address || !shippingAddress.city) {
    throw new Error("Missing shipping address for shipment creation");
  }

  const items = orderData.items || [];
  let totalWeight = 0;
  for (const item of items) {
    const qty = Number(item.quantity || 1);
    const itemWeight = parseWeightToKg(item.weight || item.variant) || 0.25;
    totalWeight += itemWeight * qty;
  }
  totalWeight = Math.max(totalWeight, 0.5);

  const totalItems = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);
  const parcelsNeeded = Math.max(1, Math.ceil(totalItems / 10));
  const parcelDescriptions = buildParcelDescriptions(items, parcelsNeeded, orderId);

  const parcels = Array.from({ length: parcelsNeeded }, (_, index) => ({
    weight_kg: Number((totalWeight / parcelsNeeded).toFixed(3)),
    length_cm: 30,
    width_cm: 25,
    height_cm: 20,
    parcel_description: parcelDescriptions[index],
  }));

  const serviceLevel = normalizeServiceLevel(shippingAddress.service_level);
  const courierCost = Number(orderData.courier_cost || 0);
  const shippingCost = Number(orderData.shipping_cost || 0);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const shipmentResponse = await fetch(`${supabaseUrl}/functions/v1/courier-guy-shipment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderId,
      delivery_address: {
        fullName: shippingAddress.fullName || "Customer",
        address: shippingAddress.address,
        city: shippingAddress.city,
        suburb: shippingAddress.suburb || shippingAddress.city,
        province: shippingAddress.province || "KwaZulu-Natal",
        postalCode: shippingAddress.postalCode || "0000",
        phone: shippingAddress.phone || "",
        email: shippingAddress.email || "",
      },
      parcels,
      order_items: items,
      service_level: serviceLevel,
      rate: shippingCost,
      original_rate: courierCost > 0 ? courierCost : shippingCost / 1.1,
    }),
  });

  const shipmentResult = await shipmentResponse.json().catch(() => null);
  if (!shipmentResponse.ok && shipmentResponse.status !== 409) {
    throw new Error(shipmentResult?.error || "Failed to create shipment");
  }

  return shipmentResult;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, tracking_token } = await req.json();
    if (!order_id || !tracking_token) {
      return new Response(JSON.stringify({ error: "order_id and tracking_token are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("tracking_token", tracking_token)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alreadyInFulfillment = ["processing", "paid", "shipped", "delivered", "completed"].includes(order.status || "");
    if (!alreadyInFulfillment) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "processing" })
        .eq("id", order.id)
        .eq("tracking_token", tracking_token);

      if (updateError) throw updateError;
      order.status = "processing";
    }

    await createInvoice(order.id, order, supabase);

    let shipmentResult: any = null;
    if (order.courier?.toLowerCase() !== "pickup" && !order.courier_waybill) {
      shipmentResult = await createCourierGuyShipment(order.id, order);
    }

    const { data: refreshedOrder, error: refreshedOrderError } = await supabase
      .from("orders")
      .select("id, status, total, courier, courier_waybill, shipping_cost, tracking_token, created_at")
      .eq("id", order.id)
      .eq("tracking_token", tracking_token)
      .single();

    if (refreshedOrderError) throw refreshedOrderError;

    return new Response(JSON.stringify({
      success: true,
      shipment: shipmentResult,
      order: refreshedOrder,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("confirm-payfast-return error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to confirm payment return" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});