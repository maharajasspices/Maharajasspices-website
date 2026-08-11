import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 2; // requests per day
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawData = await req.json();
    const formData = contactSchema.parse(rawData);
    
    console.log(`Contact form submission from: ${formData.email} (IP: ${clientIP})`);

    // Get API key from environment variable (secure)
    const web3formsKey = Deno.env.get('WEB3FORMS_CONTACT_KEY');
    
    if (!web3formsKey) {
      console.error('WEB3FORMS_CONTACT_KEY not configured');
      throw new Error('Email service not configured');
    }

    // Primary: Send via Web3Forms with proper field names
    try {
      const web3Response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: web3formsKey,
          subject: `Contact Form: ${formData.subject}`,
          from_name: 'Maharaja\'s Spices Contact Form',
          name: formData.name,
          email: formData.email,
          phone: formData.phone || 'Not provided',
          message: formData.message,
        })
      });
      
      if (!web3Response.ok) {
        throw new Error(`Web3Forms failed: ${await web3Response.text()}`);
      }
      
      console.log('Email sent successfully via Web3Forms');
    } catch (web3Error) {
      console.error('Web3Forms failed, attempting Supabase fallback:', web3Error);
      
      // Fallback: Send email notification via Supabase
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase.functions.invoke('send-email-notification', {
          body: {
            to: 'aryan.inderlall@maharajasspices.co.za',
            subject: `[Contact Form] ${formData.subject}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${formData.subject}</p>
              <p><strong>Message:</strong></p>
              <p>${formData.message}</p>
              <p><strong>IP Address:</strong> ${clientIP}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            `
          }
        });
        
        console.log('Supabase fallback notification sent');
      } catch (fallbackError) {
        console.error('Supabase fallback also failed:', fallbackError);
        throw new Error('Both Web3Forms and Supabase failed');
      }
    }

    // Store in database for records
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
        ip_address: clientIP
      });
    } catch (dbError) {
      console.error('Database storage failed (non-critical):', dbError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Message received successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    
    if (error.name === "ZodError") {
      console.error("Validation error:", error.errors);
      return new Response(
        JSON.stringify({ error: "Please check your input and try again." }),
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