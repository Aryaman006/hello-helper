import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Wallet as WalletIcon,
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  Copy,
  Share2,
  Users,
} from "lucide-react";
import { format } from "date-fns";

const Wallet = () => {
  const { user } = useAuth();

  const [balance, setBalance] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      setLoading(true);

      /* 1️⃣ Wallet balance */
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (walletError) {
        console.error(walletError);
        toast.error("Failed to load wallet");
      } else {
        setBalance(wallet?.balance || 0);
      }

      /* 2️⃣ Referral code */
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .single();

      if (!profileError) {
        setReferralCode(profile?.referral_code || null);
      }

      /* 3️⃣ Commissions (earnings) */
      const { data: comm } = await supabase
        .from("commissions")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      setCommissions(comm || []);

      /* 4️⃣ Referrals */
      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      setReferrals(refs || []);

      /* 5️⃣ Withdrawals */
      const { data: wd } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setWithdrawals(wd || []);

      setLoading(false);
    };

    fetchWallet();
  }, [user]);

  const referralLink = referralCode
    ? `https://app.playoga.co.in/signup?ref=${referralCode}`
    : "";

  const totalEarned =
    commissions.reduce((sum, c) => sum + c.amount, 0) || 0;

  const totalWithdrawn =
    withdrawals
      .filter(w => w.status === "completed")
      .reduce((sum, w) => sum + w.amount, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <WalletIcon className="w-6 h-6 text-primary" />
        My Wallet
      </h1>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={IndianRupee} label="Balance" value={balance} />
        <Stat icon={ArrowDownCircle} label="Earned" value={totalEarned} />
        <Stat icon={ArrowUpCircle} label="Withdrawn" value={totalWithdrawn} />
      </div>

      {/* Referral */}
      <div className="bg-card rounded-2xl border shadow-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-5 h-5 text-primary" />
          <p className="font-semibold">Refer & Earn ₹50</p>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            readOnly
            value={referralLink}
            className="flex-1 text-xs px-3 py-2 rounded-xl bg-muted truncate"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              toast.success("Referral link copied");
            }}
            className="px-3 py-2 rounded-xl border"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              navigator.share
                ? navigator.share({ url: referralLink })
                : navigator.clipboard.writeText(referralLink);
            }}
            className="px-3 py-2 rounded-xl border"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Users className="w-4 h-4" />
          {referrals.length} referral{referrals.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Earnings */}
      <Section title="Earnings">
        {commissions.length === 0 ? (
          <Empty text="No earnings yet" />
        ) : (
          commissions.map(c => (
            <Row
              key={c.id}
              label="Referral Commission"
              date={format(new Date(c.created_at), "MMM d, yyyy")}
              amount={`+₹${c.amount}`}
              positive
            />
          ))
        )}
      </Section>

      {/* Withdrawals */}
      <Section title="Withdrawals">
        {withdrawals.length === 0 ? (
          <Empty text="No withdrawals yet" />
        ) : (
          withdrawals.map(w => (
            <Row
              key={w.id}
              label={`₹${w.amount}`}
              date={format(new Date(w.created_at), "MMM d, yyyy")}
              amount={w.status}
            />
          ))
        )}
      </Section>
    </div>
  );
};

export default Wallet;

/* helpers */

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="bg-card rounded-2xl border shadow-card p-3 text-center">
    <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
    <p className="font-bold">₹{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="mb-6">
    <p className="font-semibold mb-2">{title}</p>
    <div className="bg-card rounded-2xl border shadow-card divide-y">
      {children}
    </div>
  </div>
);

const Row = ({ label, date, amount, positive }: any) => (
  <div className="flex justify-between px-4 py-3">
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{date}</p>
    </div>
    <span className={`text-sm font-semibold ${positive ? "text-success" : ""}`}>
      {amount}
    </span>
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <p className="text-center text-muted-foreground py-6">{text}</p>
);
