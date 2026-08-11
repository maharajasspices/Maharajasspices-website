import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: "Password required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const DASHBOARD_PASSWORD = Deno.env.get("DASHBOARD_ACCESS_PASSWORD");
    const MARKETING_DASHBOARD_PASSWORD = Deno.env.get("MARKETING_DASHBOARD_PASSWORD");

    if (!DASHBOARD_PASSWORD) {
      console.error("DASHBOARD_ACCESS_PASSWORD not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Use getClaims for fast local JWT validation instead of getUser network call
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const userEmail = (claimsData.claims.email as string || "").toLowerCase();

    // Use service role client to bypass RLS on user_roles table
    const adminClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasPrivilegedRole = roles?.some(
      (r: any) => r.role === "employee" || r.role === "admin"
    );

    if (!hasPrivilegedRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const constantTimeCompare = (a: string, b: string): boolean => {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return result === 0;
    };

    let isValid = false;

    console.log("Dashboard access attempt by:", userEmail);

    if (
      (userEmail === "marketing@maharajasspices.co.za" || userEmail === "desmond.amos@marajasspices.co.za") &&
      MARKETING_DASHBOARD_PASSWORD
    ) {
      isValid = constantTimeCompare(password, MARKETING_DASHBOARD_PASSWORD);
      if (!isValid) {
        isValid = constantTimeCompare(password, DASHBOARD_PASSWORD);
      }
    } else {
      isValid = constantTimeCompare(password, DASHBOARD_PASSWORD);
    }

    if (!isValid) {
      console.log("Failed dashboard access attempt by:", userEmail);
      return new Response(
        JSON.stringify({ success: false, error: "Incorrect password" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying dashboard access:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
