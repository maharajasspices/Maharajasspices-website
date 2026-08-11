import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailSchema = z.string().email("Invalid email address");

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max 5 requests
const RATE_WINDOW = 60000; // Per minute

const checkRateLimit = (identifier: string): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true };
  }

  if (entry.count < RATE_LIMIT) {
    entry.count++;
    return { allowed: true };
  }

  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  return { allowed: false, retryAfter };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP or forwarded header
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: `Too many requests. Please try again in ${rateCheck.retryAfter} seconds.` }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    emailSchema.parse(email);
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log(`Unsubscribe request for: ${normalizedEmail}`);

    // Deactivate subscription in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: false })
      .eq('email', normalizedEmail);

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to update subscription status');
    }

    // External newsletter provider removed — DB flag is the source of truth.
    console.log(`[newsletter-unsubscribe] Unsubscribed ${normalizedEmail} in DB only (no external sync).`);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully unsubscribed from newsletter" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in newsletter-unsubscribe function:", error);
    
    if (error.name === "ZodError") {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);