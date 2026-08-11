import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing birthday reward claim request');

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for secure operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to verify the token
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.log('Failed to authenticate user:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // Get user's profile to check birthday and opt-in status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('birthday, birthday_opt_in')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.log('Profile not found:', profileError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side date check - user cannot manipulate this
    const today = new Date();
    const serverDate = { month: today.getMonth(), day: today.getDate() };
    
    if (!profile.birthday) {
      console.log('No birthday set in profile');
      return new Response(
        JSON.stringify({ success: false, error: 'No birthday set in profile' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const birthday = new Date(profile.birthday);
    const birthdayDate = { month: birthday.getMonth(), day: birthday.getDate() };

    // Verify it's actually the user's birthday (server-side check)
    if (serverDate.month !== birthdayDate.month || serverDate.day !== birthdayDate.day) {
      console.log('Not the user\'s birthday. Server date:', serverDate, 'Birthday:', birthdayDate);
      return new Response(
        JSON.stringify({ success: false, error: 'Birthday reward can only be claimed on your birthday' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has opted in for birthday rewards
    if (!profile.birthday_opt_in) {
      console.log('User has not opted in for birthday rewards');
      return new Response(
        JSON.stringify({ success: false, error: 'Birthday opt-in required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if reward already claimed this year (with atomic check)
    const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();
    
    const { data: existingRewards, error: checkError } = await supabaseAdmin
      .from('credit_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'birthday_reward')
      .gte('created_at', yearStart);

    if (checkError) {
      console.log('Error checking existing rewards:', checkError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify eligibility' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingRewards && existingRewards.length > 0) {
      console.log('Birthday reward already claimed this year');
      return new Response(
        JSON.stringify({ success: false, error: 'Birthday reward already claimed this year', alreadyClaimed: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the birthday reward transaction (server-side, cannot be manipulated)
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: 50,
        transaction_type: 'birthday_reward',
        description: `Birthday reward ${today.getFullYear()}`,
      })
      .select()
      .single();

    if (insertError) {
      console.log('Error inserting birthday reward:', insertError.message);
      // Check if it's a duplicate (race condition protection)
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ success: false, error: 'Birthday reward already claimed', alreadyClaimed: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to award birthday reward' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Birthday reward successfully awarded:', transaction.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Birthday reward awarded successfully!',
        amount: 50
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in claim-birthday-reward:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
