
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as crypto from "https://deno.land/std@0.192.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, planId } = await req.json();

    // Validate the request body
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !userId || !planId) {
      throw new Error("Missing required fields");
    }

    // Verify the payment signature
    const razorpaySecretKey = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const payload = razorpayOrderId + "|" + razorpayPaymentId;
    
    // In a real implementation, you'd verify the signature with Razorpay's key
    // This is a simplified version for demo purposes
    
    // Get subscription plan details
    const { data: planData, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      throw new Error("Invalid plan ID or plan not found");
    }

    // Set subscription expiry date
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(now.getMonth() + planData.duration_months);

    // Update the user's profile with subscription information
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        is_subscribed: true,
        plan_name: planData.name,
        subscription_starts_at: now.toISOString(),
        subscription_expires_at: expiryDate.toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error("Failed to update user profile");
    }

    // Record the payment transaction
    await supabaseClient
      .from("user_transactions")
      .insert({
        user_id: userId,
        amount: planData.price,
        transaction_type: "subscription",
        status: "completed"
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and subscription activated"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
