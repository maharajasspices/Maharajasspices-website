import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stockistSchema = z.object({
  businessName: z.string().trim().min(2).max(200),
  contactPerson: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20),
  address: z.string().trim().min(10).max(500),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(ip);
  const DAY_MS = 24 * 60 * 60 * 1000;
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + DAY_MS });
    return true;
  }
  if (userLimit.count >= 2) return false;
  userLimit.count++;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const formData = stockistSchema.parse(await req.json());
    
    // Get API key from environment variable (secure)
    const web3formsKey = Deno.env.get('WEB3FORMS_STOCKIST_KEY');
    
    if (!web3formsKey) {
      console.error('WEB3FORMS_STOCKIST_KEY not configured');
      throw new Error('Email service not configured');
    }
    
    // Send via Web3Forms with proper field names
    const web3Response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: `Stockist Application: ${formData.businessName}`,
        from_name: 'Maharaja\'s Spices Stockist Application',
        business_name: formData.businessName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        message: formData.message || 'No additional message',
      })
    });
    
    if (!web3Response.ok) throw new Error('Web3Forms failed');

    // Store in database
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    await supabase.from('stockist_applications').insert({
      business_name: formData.businessName,
      contact_person: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      message: formData.message || null,
      ip_address: clientIP
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.name === "ZodError" ? "Invalid data" : "Error processing request" }), { status: error.name === "ZodError" ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);