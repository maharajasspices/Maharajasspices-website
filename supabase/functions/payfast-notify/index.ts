import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAT_RATE = 0.15;

const ZERO_RATED_KEYWORDS = [
  'sugar beans', 'white rice', 'masoor', 'breyani dhall', 'raw nuts', 'nuts', 'pea dhall',
];

async function sendThankYouEmail(orderId: string, supabase: any) {
  // Email provider removed. Left as a stub so the payment flow keeps working.
  // The new owner can wire up their preferred email service here.
  console.log(`[thank-you email] skipped for order ${orderId} — no email provider configured.`);
  try {
    await supabase.from('orders').update({ thank_you_sent_at: new Date().toISOString() }).eq('id', orderId);
  } catch (e) {
    console.warn('thank_you_sent_at update failed (non-fatal):', e);
  }
}


function normalizeServiceLevel(serviceLevel?: string | null): string {
  if (!serviceLevel) return 'ECO';

  const normalized = serviceLevel.trim().toUpperCase();
  const aliases: Record<string, string> = {
    ECONOMY: 'ECO',
    ECOLOCAL: 'ECO',
    OVERNIGHT: 'OVN',
  };

  return aliases[normalized] || normalized;
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

function isZeroRated(itemName: string): boolean {
  const lowerName = itemName.toLowerCase();
  return ZERO_RATED_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

function generateMD5(text: string): string {
  return new Md5().update(text).toString();
}

function pfUrlEncode(str: string): string {
  return encodeURIComponent(str.trim())
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateSignature(data: Record<string, string>, passphrase?: string): string {
  const paramPairs: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'signature' && value !== undefined && value !== null && value !== '') {
      const trimmedValue = String(value).trim();
      if (trimmedValue) {
        paramPairs.push(`${key}=${pfUrlEncode(trimmedValue)}`);
      }
    }
  }
  let paramString = paramPairs.join('&');
  if (passphrase && passphrase.trim() !== '') {
    paramString += `&passphrase=${pfUrlEncode(passphrase.trim())}`;
  }
  return generateMD5(paramString);
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function verifySignature(data: Record<string, string>, passphrase?: string): boolean {
  const receivedSignature = data.signature;
  if (!receivedSignature) {
    console.error("No signature received in ITN data");
    return false;
  }
  const generatedSignature = generateSignature(data, passphrase);
  const isValid = constantTimeCompare(receivedSignature.toLowerCase(), generatedSignature.toLowerCase());
  if (!isValid) {
    console.error(`Signature mismatch: received ${receivedSignature}, generated ${generatedSignature}`);
  }
  return isValid;
}

async function validateAmount(orderId: string, amountGross: string, supabase: any): Promise<boolean> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("total")
    .eq("id", orderId)
    .single();
  if (error || !order) {
    console.error("Error fetching order for amount validation:", error);
    return false;
  }
  const orderTotal = parseFloat(order.total).toFixed(2);
  const paidAmount = parseFloat(amountGross).toFixed(2);
  if (orderTotal !== paidAmount) {
    console.error(`Amount mismatch: order total ${orderTotal}, paid ${paidAmount}`);
    return false;
  }
  return true;
}

function parseFormData(body: string): Record<string, string> {
  const data: Record<string, string> = {};
  const pairs = body.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      data[decodeURIComponent(key)] = decodeURIComponent(value || '').replace(/\+/g, ' ');
    }
  }
  return data;
}

function calculateVatBreakdown(unitPriceExclVat: number, quantity: number, itemName: string = '') {
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
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data, error } = await supabase.rpc('nextval', { seq_name: 'invoice_number_seq' });
  let seqNum: number;
  if (error || !data) {
    seqNum = Math.floor(Date.now() / 1000) % 100000;
  } else {
    seqNum = parseInt(data);
  }
  return `INV-${yearMonth}-${String(seqNum).padStart(5, '0')}`;
}

async function createInvoice(orderId: string, orderData: any, pfPaymentId: string, supabase: any): Promise<void> {
  console.log(`Creating invoice for order ${orderId}`);
  const shippingAddress = orderData.shipping_address || {};
  const items = orderData.items || [];
  const lineItems: any[] = [];
  let subtotalExclVat = 0;
  let totalVat = 0;
  let totalInclVat = 0;

  for (const item of items) {
    const vatBreakdown = calculateVatBreakdown(item.price, item.quantity, item.name);
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
    const isPickup = orderData.courier?.toLowerCase() === 'pickup';
    const shippingVatBreakdown = calculateVatBreakdown(orderData.shipping_cost, 1, isPickup ? 'pickup' : 'shipping');
    lineItems.push({
      product_id: null,
      name: `Shipping - ${orderData.courier || 'Standard Delivery'}`,
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
      name: `Voucher Discount${orderData.voucher_code ? ` (${orderData.voucher_code})` : ''}`,
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
      name: 'M-Wallet Credits Applied',
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
      name: 'Rounding Adjustment',
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
    .from('invoices')
    .select('id, invoice_number')
    .eq('order_id', orderId)
    .maybeSingle();

  const invoiceNumber = existingInvoice?.invoice_number || await generateInvoiceNumber(supabase);
  const invoicePayload = {
    order_id: orderId,
    user_id: orderData.user_id || null,
    invoice_number: invoiceNumber,
    customer_name: shippingAddress.fullName || 'Customer',
    customer_email: shippingAddress.email || null,
    customer_phone: shippingAddress.phone || null,
    customer_address: shippingAddress,
    line_items: lineItems,
    subtotal_excl_vat: subtotalExclVat,
    total_vat: totalVat,
    total_incl_vat: totalInclVat,
    vat_rate: VAT_RATE * 100,
    payment_reference: pfPaymentId,
  };

  const query = existingInvoice
    ? supabase.from('invoices').update(invoicePayload).eq('id', existingInvoice.id)
    : supabase.from('invoices').insert(invoicePayload);

  const { error: invoiceError } = await query;
  if (invoiceError) {
    console.error("Error creating invoice:", invoiceError);
    throw invoiceError;
  }

  console.log(`Invoice ${invoiceNumber} upserted for order ${orderId}`);
}

// Auto-create Courier Guy shipment after successful payment
async function createCourierGuyShipment(orderId: string, orderData: any, supabase: any): Promise<void> {
  // Only create shipment for courier deliveries (not pickup)
  if (!orderData.courier || orderData.courier.toLowerCase() === 'pickup') {
    console.log(`Order ${orderId}: Pickup order, skipping Courier Guy shipment`);
    return;
  }

  const shippingAddress = orderData.shipping_address || {};
  if (!shippingAddress.address || !shippingAddress.city) {
    console.error(`Order ${orderId}: Missing shipping address for shipment creation`);
    return;
  }

  // Calculate parcel weight from items
  const items = orderData.items || [];
  let totalWeight = 0;
  for (const item of items) {
    const qty = item.quantity || 1;
    // Parse weight from item if available
    const w = (item.weight || item.variant || '').toLowerCase();
    let itemWeight = 0.3; // default 300g
    const kgMatch = w.match(/([\d.]+)\s*kg/);
    const gMatch = w.match(/([\d.]+)\s*g/);
    if (kgMatch) itemWeight = parseFloat(kgMatch[1]);
    else if (gMatch) itemWeight = parseFloat(gMatch[1]) / 1000;
    totalWeight += itemWeight * qty;
  }
  totalWeight = Math.max(totalWeight, 1); // Minimum 1kg

  const totalItems = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
  const parcelsNeeded = Math.ceil(totalItems / 10);
  const parcelDescriptions = buildParcelDescriptions(items, parcelsNeeded, orderId);

  const parcels = Array.from({ length: parcelsNeeded }, (_, index) => ({
    weight_kg: totalWeight / parcelsNeeded,
    length_cm: 30,
    width_cm: 25,
    height_cm: 20,
    parcel_description: parcelDescriptions[index],
  }));

  const serviceLevel = normalizeServiceLevel(shippingAddress.service_level);
  const courierCost = orderData.courier_cost || 0;
  const shippingCost = orderData.shipping_cost || 0;

  const shipmentBody = {
    order_id: orderId,
    delivery_address: {
      fullName: shippingAddress.fullName || 'Customer',
      address: shippingAddress.address,
      city: shippingAddress.city,
      suburb: shippingAddress.city,
      province: shippingAddress.province || 'KwaZulu-Natal',
      postalCode: shippingAddress.postalCode || '0000',
      phone: shippingAddress.phone || '',
      email: shippingAddress.email || '',
    },
    parcels,
    order_items: items,
    service_level: serviceLevel,
    rate: shippingCost,
    original_rate: courierCost > 0 ? courierCost : shippingCost / 1.10,
  };

  console.log(`Creating Courier Guy shipment for order ${orderId}:`, JSON.stringify(shipmentBody));

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Call the courier-guy-shipment edge function directly via HTTP
    const shipmentResponse = await fetch(`${supabaseUrl}/functions/v1/courier-guy-shipment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentBody),
    });

    const shipmentResult = await shipmentResponse.json();

    if (shipmentResponse.ok && shipmentResult.success) {
      console.log(`Courier Guy shipment created for order ${orderId}. Waybill: ${shipmentResult.waybill}`);
    } else if (shipmentResponse.status === 409 && shipmentResult?.error === 'Shipment creation already in progress') {
      console.log(`Courier Guy shipment already being created for order ${orderId}; skipping duplicate request.`);
    } else if (shipmentResponse.ok && shipmentResult?.waybill) {
      console.log(`Courier Guy shipment already exists for order ${orderId}. Waybill: ${shipmentResult.waybill}`);
    } else {
      console.error(`Courier Guy shipment failed for order ${orderId}:`, JSON.stringify(shipmentResult));
    }
  } catch (error) {
    console.error(`Error creating Courier Guy shipment for order ${orderId}:`, error);
    // Don't fail the ITN - shipment can be retried manually
  }
}

// PayFast ITN handler
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("PayFast ITN received");
    
    let data: Record<string, string> = {};
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const rawBody = await req.text();
      data = parseFormData(rawBody);
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
    } else {
      const rawBody = await req.text();
      data = parseFormData(rawBody);
    }

    const paymentStatus = data.payment_status;
    const orderId = data.m_payment_id;
    const pfPaymentId = data.pf_payment_id;
    const amountGross = data.amount_gross;

    if (!orderId) {
      console.error("No order ID in ITN data");
      return new Response("Missing order ID", { status: 400, headers: corsHeaders });
    }

    console.log("Processing ITN for order:", orderId, "Status:", paymentStatus);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";

    // Verify signature
    const isValidSignature = verifySignature(data, passphrase);
    if (!isValidSignature) {
      console.error("Invalid PayFast signature for order:", orderId);
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    // Validate amount
    if (!await validateAmount(orderId, amountGross, supabase)) {
      console.error("Amount validation failed for order:", orderId);
      return new Response("Amount mismatch", { status: 400, headers: corsHeaders });
    }

    // Check idempotency
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("status, courier, courier_waybill")
      .eq("id", orderId)
      .single();

    if (paymentStatus === "COMPLETE") {
      console.log(`Payment COMPLETE for order ${orderId}`);

      const alreadyInFulfillment = ["processing", "paid", "shipped", "delivered", "completed"].includes(existingOrder?.status || "");

      if (!alreadyInFulfillment) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: "processing" })
          .eq("id", orderId);

        if (updateError) {
          console.error("Error updating order:", updateError);
        } else {
          console.log(`Order ${orderId} marked as processing`);
          // Fire thank-you email (stub — no provider configured) — non-blocking
          try {
            await sendThankYouEmail(orderId, supabase);
          } catch (e) {
            console.error("Thank-you email failed:", e);
          }
        }
      } else {
        console.log(`Order ${orderId} already in fulfillment flow - reconciling invoice and shipment`);
      }

      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderData) {
        try {
          await createInvoice(orderId, orderData, pfPaymentId || '', supabase);
        } catch (invoiceError) {
          console.error("Error creating invoice:", invoiceError);
        }

        if (orderData.courier?.toLowerCase() !== 'pickup' && !orderData.courier_waybill) {
          try {
            await createCourierGuyShipment(orderId, orderData, supabase);
          } catch (shipmentError) {
            console.error("Error creating shipment:", shipmentError);
          }
        }
      }
    } else if (paymentStatus === "FAILED") {
      console.log(`Payment FAILED for order ${orderId}`);
      await supabase.from("orders").update({ status: "payment_failed" }).eq("id", orderId);
    } else if (paymentStatus === "CANCELLED") {
      console.log(`Payment CANCELLED for order ${orderId}`);
      await supabase.from("orders").update({ status: "payment_cancelled" }).eq("id", orderId);
    } else if (paymentStatus === "PENDING") {
      console.log(`Payment PENDING for order ${orderId}`);
      await supabase.from("orders").update({ status: "payment_pending" }).eq("id", orderId);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("PayFast ITN error:", error);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
