import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Crown,
  Sparkles,
  Wallet,
  Play,
  CheckCircle,
  Clock,
  Mail,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import PremiumBadge from "@/components/ui/PremiumBadge";

interface WatchStats {
  videosWatched: number;
  completed: number;
  minutesWatched: number;
}

const Profile = () => {
  const { user, signOut, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();

  const [points, setPoints] = useState(0);
  const [stats, setStats] = useState<WatchStats>({
    videosWatched: 0,
    completed: 0,
    minutesWatched: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;

    const pointsRes = await supabase.rpc("get_user_yogic_points", {
      _user_id: user.id,
    });
    setPoints(pointsRes.data || 0);

    const watchRes = await supabase
      .from("watch_progress")
      .select("watched_seconds, completed")
      .eq("user_id", user.id);

    if (watchRes.data) {
      const rows = watchRes.data;
      setStats({
        videosWatched: rows.length,
        completed: rows.filter(r => r.completed).length,
        minutesWatched: Math.floor(
          rows.reduce((s, r) => s + (r.watched_seconds || 0), 0) / 60
        ),
      });
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="px-5 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <button
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="text-destructive font-semibold"
        >
          Log Out
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl border shadow-card mb-5">
        <div className="flex items-center gap-4 px-4 py-4 border-b">
          <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center text-white font-bold text-xl">
            {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {hasActiveSubscription && <PremiumBadge />}
          </div>
        </div>

        <Row icon={UserIcon} label="Full Name" value={user.user_metadata?.full_name || "Not set"} />
        <Row icon={Mail} label="Email" value={user.email || ""} />
        <Row icon={Calendar} label="Member Since" value={memberSince} last />
      </div>

      {/* Subscription */}
      <div className="bg-card rounded-2xl border shadow-card p-4 mb-5">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-gold" />
          <span className="font-semibold">
            {hasActiveSubscription ? "Active Subscription" : "Free Plan"}
          </span>
        </div>
      </div>

      {/* Yogic Points */}
      <div className="bg-card rounded-2xl border shadow-card p-4 mb-5">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <div>
            <p className="text-2xl font-bold">{points}</p>
            <p className="text-xs text-muted-foreground">Yogic Points</p>
          </div>
        </div>
      </div>

      {/* Wallet CTA — SAME AS WEB */}
      <div
        onClick={() => navigate("/wallet")}
        className="bg-gradient-warm rounded-2xl p-4 mb-5 text-primary-foreground cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6" />
          <div>
            <p className="font-bold">Wallet & Referrals</p>
            <p className="text-xs opacity-90">
              Earn ₹50 for every successful referral
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Play} label="Watched" value={stats.videosWatched} />
        <Stat icon={CheckCircle} label="Completed" value={stats.completed} />
        <Stat icon={Clock} label="Minutes" value={stats.minutesWatched} />
      </div>
    </div>
  );
};

export default Profile;

/* helpers */

const Row = ({ icon: Icon, label, value, last }: any) => (
  <div className={`flex justify-between px-4 py-3 ${last ? "" : "border-b"}`}>
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm">{value}</span>
  </div>
);

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="bg-card rounded-2xl border shadow-card p-3 text-center">
    <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
    <p className="font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);
