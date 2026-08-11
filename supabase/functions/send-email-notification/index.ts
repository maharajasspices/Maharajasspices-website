// Email notification stub.
// The previous Brevo integration was removed. This function now logs
// what it would have sent and returns success so callers do not fail.
// The new owner can wire up their preferred email service here.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  type: 'contact' | 'stockist';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    console.log(
      `[send-email-notification] Stub — no email provider configured. ` +
      `type=${payload.type} to=${payload.to} subject="${payload.subject}" ` +
      `htmlSize=${payload.htmlContent?.length || 0}`
    );

    return new Response(
      JSON.stringify({ success: true, warning: "Email provider not configured — email was not sent." }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-email-notification stub:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Bad request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
