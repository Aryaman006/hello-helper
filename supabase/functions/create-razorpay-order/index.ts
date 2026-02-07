import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_PRICE = 999;
const GST_RATE = 0.05;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    const { amount, couponCode } = await req.json();

    // Validate coupon server-side if provided
    let discount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: coupon } = await adminSupabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (now >= validFrom && (!validUntil || now <= validUntil)) {
          if (!coupon.max_uses || coupon.times_used < coupon.max_uses) {
            if (coupon.discount_type === "percentage") {
              discount = Math.round((BASE_PRICE * coupon.discount_value) / 100);
            } else {
              discount = coupon.discount_value;
            }
            if (coupon.max_discount && discount > coupon.max_discount) {
              discount = coupon.max_discount;
            }
            couponId = coupon.id;
          }
        }
      }
    }

    // Calculate amounts server-side
    const subtotal = BASE_PRICE - discount;
    const gstAmount = Math.round(subtotal * GST_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;
    const amountInPaise = Math.round(totalAmount * 100);

    // Fetch user profile for prefill
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    // Create Razorpay order
    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${razorpayAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `sub_${userId.substring(0, 8)}_${Date.now()}`,
        notes: {
          userId,
          couponId: couponId || null,
          discount,
          gstAmount,
          baseAmount: BASE_PRICE,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorBody = await orderResponse.text();
      console.error("Razorpay order creation failed:", errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await orderResponse.json();

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        keyId: razorpayKeyId,
        prefill: {
          name: profile?.full_name || "",
          email: userEmail || "",
        },
        notes: {
          couponId,
          discount,
          gstAmount,
          baseAmount: BASE_PRICE,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
