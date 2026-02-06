import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Check, Loader2, Tag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BASE_PRICE = 999;
const GST_RATE = 0.05;

const BENEFITS = [
  'Unlimited access to all classes',
  'Live session access',
  'Exclusive premium content',
  'Ad-free experience',
  'Priority support',
];

const Subscribe = () => {
  const navigate = useNavigate();
  const { user, hasActiveSubscription, refreshSubscription } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    discount: number;
    message: string;
  } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Price calculations (display only — backend recalculates)
  const discount = appliedCoupon?.discount ?? 0;
  const subtotal = BASE_PRICE - discount;
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim(), baseAmount: BASE_PRICE },
      });

      if (error || !data?.discount) {
        toast.error(data?.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          id: data.couponId,
          discount: data.discount,
          message: data.message,
        });
        toast.success(data.message || 'Coupon applied!');
      }
    } catch {
      toast.error('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/subscribe' } });
      return;
    }

    setPaymentLoading(true);

    try {
      // Step 1: Create order (backend calculates real amounts)
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            amount: BASE_PRICE,
            couponCode: appliedCoupon ? couponCode.trim() : undefined,
          },
        }
      );

      if (orderError || !orderData?.orderId) {
        toast.error('Failed to create payment order');
        setPaymentLoading(false);
        return;
      }

      // Step 2: Load Razorpay
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Payment gateway failed to load');
        setPaymentLoading(false);
        return;
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Playoga',
        description: 'Premium Yearly Subscription',
        order_id: orderData.orderId,
        prefill: orderData.prefill || { email: user.email },
        theme: { color: '#D4A574' },
        handler: async (response: any) => {
          // Step 4: Verify payment
          try {
            const { error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  couponId: appliedCoupon?.id,
                  baseAmount: BASE_PRICE,
                  gstAmount: gst,
                  discountAmount: discount,
                  totalAmount: total,
                },
              }
            );

            if (verifyError) {
              toast.error('Payment verification failed. Contact support.');
            } else {
              toast.success('Welcome to Premium! 🎉');
              await refreshSubscription();
              navigate('/browse');
            }
          } catch {
            toast.error('Payment verification failed');
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      };

      new window.Razorpay(options).open();
    } catch {
      toast.error('Something went wrong');
      setPaymentLoading(false);
    }
  };

  // Already subscribed
  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background px-5 pt-6 pb-4">
        <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }} className="mb-6">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">You're Premium!</h1>
          <p className="text-muted-foreground font-body mb-8">
            You have full access to all content
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="px-8 py-3.5 rounded-2xl gradient-gold text-primary-foreground font-semibold font-body shadow-glow active:scale-[0.98] transition-transform"
          >
            Browse Content
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative h-48 gradient-gold overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-3"
          >
            <Crown className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-2xl font-bold text-primary-foreground text-center"
          >
            Upgrade to Premium
          </motion.h1>
          <p className="text-primary-foreground/70 text-sm font-body mt-1">
            Unlock your full yoga journey
          </p>
        </div>
        <button
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
          className="absolute top-4 left-4 safe-top w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      <div className="px-5 -mt-6 relative z-10 pb-8">
        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 mb-4"
        >
          <h2 className="font-heading text-base font-semibold text-foreground mb-3">
            Premium Benefits
          </h2>
          <ul className="space-y-2.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-sm text-foreground font-body">{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Coupon */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-accent" />
            <span className="text-sm font-body font-semibold text-foreground">Have a coupon?</span>
          </div>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-success/10 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-body font-semibold text-success">{appliedCoupon.message}</p>
                <p className="text-xs text-success/70 font-body">-₹{appliedCoupon.discount}</p>
              </div>
              <button
                onClick={removeCoupon}
                className="text-xs text-destructive font-body font-semibold"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 h-10 px-4 rounded-xl bg-secondary border border-border text-foreground text-sm font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={validateCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 h-10 rounded-xl gradient-gold text-primary-foreground text-sm font-body font-semibold disabled:opacity-50 flex items-center gap-1"
              >
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Price Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 mb-6"
        >
          <h3 className="font-heading text-base font-semibold text-foreground mb-3">Price Details</h3>
          <div className="space-y-2 text-sm font-body">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yearly Plan</span>
              <span className="text-foreground">₹{BASE_PRICE}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Coupon Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (5%)</span>
              <span className="text-foreground">₹{gst.toFixed(2)}</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground text-base">Total</span>
              <span className="font-heading font-bold text-xl text-foreground">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Pay Button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={handlePayment}
          disabled={paymentLoading}
          className="w-full py-4 rounded-2xl gradient-gold text-primary-foreground font-semibold font-body text-base shadow-glow active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {paymentLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Pay ₹{total.toFixed(2)}
            </>
          )}
        </motion.button>

        <p className="text-center text-xs text-muted-foreground font-body mt-3">
          Secure payment via Razorpay · 1 year subscription
        </p>
      </div>
    </div>
  );
};

export default Subscribe;
