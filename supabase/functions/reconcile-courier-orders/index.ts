import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const authorized = authHeader === `Bearer ${anonKey}` || authHeader === `Bearer ${serviceKey}`;
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(Number(body.batchSize || 20), 1), 50);

    const { data: candidateOrders, error: orderError } = await supabase
      .from("orders")
      .select("id, status, courier_waybill, created_at, shipping_address")
      .eq("courier", "The Courier Guy")
      .is("courier_waybill", null)
      .in("status", ["pending", "paid", "processing"])
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (orderError) {
      throw orderError;
    }

    const orders = candidateOrders || [];
    const orderIds = orders.map((order) => order.id);

    const { data: invoices } = orderIds.length
      ? await supabase.from("invoices").select("order_id").in("order_id", orderIds)
      : { data: [] as Array<{ order_id: string }> };

    const invoiceOrderIds = new Set((invoices || []).map((invoice) => invoice.order_id));

    const results = {
      scanned: orders.length,
      attempted: 0,
      recovered: 0,
      skipped_unpaid: 0,
      failed: 0,
      failures: [] as Array<{ order_id: string; error: string }>,
    };

    for (const order of orders) {
      const shippingAddress = order.shipping_address || {};
      const hasRequiredAddress = Boolean(shippingAddress.address && shippingAddress.city && shippingAddress.postalCode);
      const eligible = hasRequiredAddress && (order.status === "processing" || order.status === "paid" || invoiceOrderIds.has(order.id));
      if (!eligible) {
        results.skipped_unpaid += 1;
        continue;
      }

      results.attempted += 1;

      const response = await fetch(`${supabaseUrl}/functions/v1/retry-shipment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: order.id }),
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};

      if (response.ok && payload?.success) {
        results.recovered += 1;
      } else {
        results.failed += 1;
        results.failures.push({
          order_id: order.id,
          error: payload?.error || payload?.details || "Retry failed",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reconcile courier orders error:", error);
    return new Response(JSON.stringify({ error: "Failed to reconcile courier orders" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});