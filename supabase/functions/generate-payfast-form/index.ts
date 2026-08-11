import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PayFast URL
const PAYFAST_URL = "https://www.payfast.co.za/eng/process";

interface PaymentRequest {
  orderId: string;
  amount: number;
  itemName: string;
  itemDescription?: string;
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
}

function generateMD5(text: string): string {
  return new Md5().update(text).toString();
}

// PayFast requires fields in a SPECIFIC ORDER
const PAYFAST_FIELD_ORDER = [
  'merchant_id',
  'merchant_key', 
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'email_confirmation',
  'confirmation_address',
  'payment_method',
  'subscription_type',
  'billing_date',
  'recurring_amount',
  'frequency',
  'cycles',
];

// URL encode using quote_plus style (spaces become +)
function pfUrlEncode(str: string): string {
  return encodeURIComponent(str.trim())
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateSignature(data: Record<string, string>, passphrase?: string): string {
  const paramPairs: string[] = [];
  
  for (const key of PAYFAST_FIELD_ORDER) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      const value = String(data[key]).trim();
      if (value) {
        paramPairs.push(`${key}=${pfUrlEncode(value)}`);
      }
    }
  }
  
  let paramString = paramPairs.join('&');
  
  if (passphrase && passphrase.trim() !== '') {
    paramString += `&passphrase=${pfUrlEncode(passphrase.trim())}`;
  }
  
  console.log('Signature string (first 100 chars):', paramString.substring(0, 100));
  
  const signature = generateMD5(paramString);
  console.log('Generated signature:', signature);
  
  return signature;
}

serve(async (req: Request) => {
  console.log('=== PayFast Form Request ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PaymentRequest = await req.json();
    console.log('Request body:', JSON.stringify(body));

    // Validate required fields
    if (!body.orderId || !body.amount || !body.itemName || !body.customerEmail) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.amount <= 0) {
      console.error('Invalid amount:', body.amount);
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, status, tracking_token')
      .eq('id', body.orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', body.orderId, orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order found:', order.id, 'Total:', order.total, 'Status:', order.status);

    // Verify amount matches (with tolerance)
    const amountDiff = Math.abs(order.total - body.amount);
    if (amountDiff > 0.01) {
      console.error('Amount mismatch:', order.total, 'vs', body.amount);
      return new Response(
        JSON.stringify({ error: 'Amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent double payment
    if (order.status === 'paid') {
      console.error('Order already paid');
      return new Response(
        JSON.stringify({ error: 'Order already paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get credentials
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
    const merchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY');
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE');

    console.log('Credentials loaded:', !!merchantId, !!merchantKey, !!passphrase);

    if (!merchantId || !merchantKey) {
      console.error('PayFast credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = req.headers.get('origin') || 'https://www.maharajasspices.co.za';
    console.log('Origin:', origin);

    const returnUrl = new URL(`${origin}/payment-success`);
    returnUrl.searchParams.set('order_id', body.orderId);
    if (order.tracking_token) {
      returnUrl.searchParams.set('tracking_token', order.tracking_token);
    }

    const cancelUrl = new URL(`${origin}/payment-cancelled`);
    cancelUrl.searchParams.set('order_id', body.orderId);

    // Build fields
    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl.toString(),
      cancel_url: cancelUrl.toString(),
      notify_url: `${supabaseUrl}/functions/v1/payfast-notify`,
      email_address: body.customerEmail.trim(),
      m_payment_id: body.orderId,
      amount: body.amount.toFixed(2),
      item_name: body.itemName.substring(0, 100).trim(),
    };

    // Add item description with order breakdown (max 255 chars)
    if (body.itemDescription?.trim()) {
      fields.item_description = body.itemDescription.trim().substring(0, 255);
    }

    if (body.customerFirstName?.trim()) {
      fields.name_first = body.customerFirstName.trim().substring(0, 100);
    }
    if (body.customerLastName?.trim()) {
      fields.name_last = body.customerLastName.trim().substring(0, 100);
    }

    console.log('Form fields:', JSON.stringify(fields, null, 2));

    // Generate signature
    const signature = generateSignature(fields, passphrase);
    fields.signature = signature;

    console.log('=== PayFast Form Generated Successfully ===');

    return new Response(
      JSON.stringify({
        formAction: PAYFAST_URL,
        fields: fields,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating PayFast form:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate payment form' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
