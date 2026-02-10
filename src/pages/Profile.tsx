import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  LogOut,
  Crown,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Play,
  CheckCircle,
  Clock,
  Mail,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PremiumBadge from "@/components/ui/PremiumBadge";

/* ===============================
   Types
=============================== */

interface ProfileData {
  full_name?: string;
}

interface WatchStats {
  videosWatched: number;
  completed: number;
  minutesWatched: number;
}

/* ===============================
   Component
=============================== */

const Profile = () => {
  const { user, signOut, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [points, setPoints] = useState(0);
  const [profileName, setProfileName] = useState('');
  const [watchStats, setWatchStats] = useState<WatchStats>({
    videosWatched: 0,
    completed: 0,
    minutesWatched: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setProfileName(user.user_metadata.full_name)

    /* 1️⃣ PROFILE (CRITICAL – never block) */
    const profileRes = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

    if (profileRes.data) {
      setProfile(profileRes.data);
    }

    /* 2️⃣ YOGIC POINTS */
    const pointsRes = await supabase.rpc("get_user_yogic_points", {
      _user_id: user.id,
    });

    if (pointsRes.data !== null) {
      setPoints(pointsRes.data);
    }

    /* 3️⃣ WATCH STATS */
    const watchRes = await supabase.from("watch_progress").select("watched_seconds, completed").eq("user_id", user.id);

    if (watchRes.data) {
      const rows = watchRes.data;
      setWatchStats({
        videosWatched: rows.length,
        completed: rows.filter((r: any) => r.completed).length,
        minutesWatched: Math.floor(rows.reduce((sum: number, r: any) => sum + (r.watched_seconds || 0), 0) / 60),
      });
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  /* ===============================
     Logged-out state
  =============================== */

  if (!user) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground mb-6">Sign in to view your profile</p>
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3.5 rounded-2xl gradient-gold text-primary-foreground font-semibold shadow-glow"
        >
          Sign In
        </button>
      </div>
    );
  }

  /* ===============================
     Derived values
  =============================== */

  const displayName = profileName?.split(' ')[0] || "Not set";

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0].toUpperCase() || "U";

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  /* ===============================
     Render
  =============================== */

  return (
    <div className="px-5 pt-6 pb-8">
      {refreshing && (
        <div className="flex justify-center mb-4">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">Log Out</span>
        </button>
      </motion.div>

      {/* Profile Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-4 border-b border-border/50">
            <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center text-xl font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              {hasActiveSubscription && <PremiumBadge />}
            </div>
          </div>

          <InfoRow icon={UserIcon} label="Full Name" value={displayName} />
          <InfoRow icon={Mail} label="Email" value={user.email || ""} />
          <InfoRow icon={Calendar} label="Member Since" value={memberSince} last />
        </div>
      </motion.div>

      {/* Subscription */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4 mb-5">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <span className="text-sm font-semibold">{hasActiveSubscription ? "Active" : "Inactive"}</span>
        </div>
      </div>

      {/* Yogic Points */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4 mb-5">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-accent" />
          <div>
            <p className="text-2xl font-bold">{points}</p>
            <p className="text-xs text-muted-foreground">Earned from completing videos</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon={Play} label="Videos Watched" value={watchStats.videosWatched} />
        <StatCard icon={CheckCircle} label="Completed" value={watchStats.completed} />
        <StatCard icon={Clock} label="Minutes Watched" value={watchStats.minutesWatched} />
      </div>

      {/* Help */}
      <button className="w-full flex items-center justify-between px-4 py-3.5 bg-card rounded-2xl border border-border/50 shadow-card">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm">Help & Support</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </button>

      <button onClick={handleRefresh} className="w-full text-center text-xs text-muted-foreground mt-6">
        Tap to refresh
      </button>
    </div>
  );
};

/* ===============================
   UI helpers
=============================== */

const InfoRow = ({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  last?: boolean;
}) => (
  <div
    className={`flex items-center justify-between px-4 py-3.5 min-h-[48px] ${last ? "" : "border-b border-border/50"}`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm truncate max-w-[180px]">{value}</span>
  </div>
);

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
  <div className="bg-card rounded-2xl border border-border/50 shadow-card p-3 text-center">
    <Icon className="w-5 h-5 text-accent mx-auto mb-1" />
    <p className="text-lg font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default Profile;
