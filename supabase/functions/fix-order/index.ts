import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VAT_RATE = 0.15;
const ZERO_RATED_KEYWORDS = ['sugar beans', 'white rice', 'masoor', 'breyani dhall', 'raw nuts', 'nuts', 'pea dhall'];

function isZeroRated(name: string): boolean {
  const lower = name.toLowerCase();
  return ZERO_RATED_KEYWORDS.some(k => lower.includes(k));
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function buildInvoicePayload(order: any, invoiceNumber: string, paymentReference?: string | null) {
  const addr = order.shipping_address || {};
  const items = order.items || [];
  const lineItems: any[] = [];
  let subtotalExcl = 0;
  let totalVat = 0;
  let totalIncl = 0;

  for (const item of items) {
    const unitExcl = Number(item.price || 0);
    const qty = Number(item.quantity || 0);
    const zeroRated = isZeroRated(item.name || '');
    const unitVat = zeroRated ? 0 : round2(unitExcl * VAT_RATE);
    const unitIncl = round2(unitExcl + unitVat);
    const lineExcl = round2(unitExcl * qty);
    const lineVat = zeroRated ? 0 : round2(lineExcl * VAT_RATE);
    const lineIncl = round2(lineExcl + lineVat);

    lineItems.push({
      product_id: item.productId || item.product_id || null,
      name: zeroRated ? `${item.name} (Zero-Rated)` : item.name,
      quantity: qty,
      unit_price_incl: unitIncl,
      unit_price_excl: unitExcl,
      unit_vat: unitVat,
      line_total_incl: lineIncl,
      line_total_excl: lineExcl,
      line_vat: lineVat,
      is_zero_rated: zeroRated,
    });

    subtotalExcl += lineExcl;
    totalVat += lineVat;
    totalIncl += lineIncl;
  }

  const shippingCost = Number(order.shipping_cost || 0);
  const isPickup = (order.courier || '').toLowerCase() === 'pickup';
  if (shippingCost > 0) {
    const shippingVat = isPickup ? 0 : round2(shippingCost * VAT_RATE);
    const shippingIncl = round2(shippingCost + shippingVat);
    lineItems.push({
      product_id: null,
      name: `Shipping - ${order.courier || 'Standard'}`,
      quantity: 1,
      unit_price_incl: shippingIncl,
      unit_price_excl: shippingCost,
      unit_vat: shippingVat,
      line_total_incl: shippingIncl,
      line_total_excl: shippingCost,
      line_vat: shippingVat,
      is_zero_rated: isPickup,
    });
    subtotalExcl += shippingCost;
    totalVat += shippingVat;
    totalIncl += shippingIncl;
  }

  const voucherDiscount = Number(order.voucher_discount || 0);
  if (voucherDiscount > 0) {
    lineItems.push({
      product_id: null,
      name: `Voucher Discount${order.voucher_code ? ` (${order.voucher_code})` : ''}`,
      quantity: 1,
      unit_price_incl: -voucherDiscount,
      unit_price_excl: -voucherDiscount,
      unit_vat: 0,
      line_total_incl: -voucherDiscount,
      line_total_excl: -voucherDiscount,
      line_vat: 0,
      is_zero_rated: true,
    });
    subtotalExcl -= voucherDiscount;
    totalIncl -= voucherDiscount;
  }

  const creditsUsed = Number(order.credits_used || 0);
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
    subtotalExcl -= creditsUsed;
    totalIncl -= creditsUsed;
  }

  const expectedTotal = round2(Number(order.total || 0));
  const delta = round2(expectedTotal - totalIncl);
  if (Math.abs(delta) >= 0.01) {
    lineItems.push({
      product_id: null,
      name: 'Rounding Adjustment',
      quantity: 1,
      unit_price_incl: delta,
      unit_price_excl: delta,
      unit_vat: 0,
      line_total_incl: delta,
      line_total_excl: delta,
      line_vat: 0,
      is_zero_rated: true,
    });
    subtotalExcl += delta;
    totalIncl += delta;
  }

  return {
    order_id: order.id,
    user_id: order.user_id || null,
    invoice_number: invoiceNumber,
    customer_name: addr.fullName || 'Customer',
    customer_email: addr.email || null,
    customer_phone: addr.phone || null,
    customer_address: addr,
    line_items: lineItems,
    subtotal_excl_vat: round2(subtotalExcl),
    total_vat: round2(totalVat),
    total_incl_vat: round2(totalIncl),
    vat_rate: 15,
    payment_reference: paymentReference || null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, waybill, fix_total, paid_total, rebuild_invoice } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', order_id).single();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, any> = {};
    let updatedOrder = { ...order };

    if (fix_total) {
      const items = updatedOrder.items || [];
      const shippingCost = Number(updatedOrder.shipping_cost || 0);
      const isPickup = (updatedOrder.courier || '').toLowerCase() === 'pickup';
      const productTax = round2(items.reduce((sum: number, item: any) => {
        if (isZeroRated(item.name || '')) return sum;
        const lineExcl = round2(Number(item.price || 0) * Number(item.quantity || 0));
        return sum + round2(lineExcl * VAT_RATE);
      }, 0));
      const shippingTax = isPickup ? 0 : round2(shippingCost * VAT_RATE);
      const calculatedTax = round2(productTax + shippingTax);

      const voucherDiscount = Number(updatedOrder.voucher_discount || 0);
      const creditsUsed = Number(updatedOrder.credits_used || 0);
      const computedTotal = round2(Number(updatedOrder.subtotal) + shippingCost + calculatedTax - voucherDiscount - creditsUsed);
      const correctedTotal = typeof paid_total === 'number' && paid_total > 0 ? round2(paid_total) : computedTotal;

      const { error } = await supabase.from('orders').update({
        total: correctedTotal,
        tax: calculatedTax,
      }).eq('id', order_id);

      results.total_fixed = !error;
      results.old_total = Number(order.total);
      results.new_total = correctedTotal;
      results.new_tax = calculatedTax;
      if (error) results.total_error = error.message;

      if (!error) {
        updatedOrder.total = correctedTotal;
        updatedOrder.tax = calculatedTax;
      }
    }

    if (waybill) {
      const { error } = await supabase.from('orders').update({
        courier_waybill: waybill,
        courier: 'The Courier Guy',
      }).eq('id', order_id);
      results.waybill_restored = !error;
      if (error) results.waybill_error = error.message;
    }

    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, payment_reference')
      .eq('order_id', order_id)
      .maybeSingle();

    const shouldRebuild = Boolean(rebuild_invoice || fix_total || !existingInvoice);
    if (shouldRebuild) {
      const invoiceNumber = existingInvoice?.invoice_number || `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${Date.now().toString().slice(-5)}`;
      const invoicePayload = buildInvoicePayload(updatedOrder, invoiceNumber, existingInvoice?.payment_reference || null);

      const query = existingInvoice
        ? supabase.from('invoices').update(invoicePayload).eq('id', existingInvoice.id)
        : supabase.from('invoices').insert(invoicePayload);

      const { error: invError } = await query;
      results.invoice_rebuilt = !invError;
      results.invoice_number = invoiceNumber;
      if (invError) results.invoice_error = invError.message;
    } else {
      results.invoice_exists = true;
      results.invoice_number = existingInvoice?.invoice_number;
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Fix order error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
