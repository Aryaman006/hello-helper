import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  LogOut, Crown, Sparkles, ChevronRight, HelpCircle,
  Play, CheckCircle, Clock, Mail, User as UserIcon, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PremiumBadge from '@/components/ui/PremiumBadge';

interface ProfileData {
  full_name?: string;
}

interface SubscriptionData {
  status: string;
  plan_type: string;
  end_date: string;
}

interface WatchStats {
  videosWatched: number;
  completed: number;
  minutesWatched: number;
}

const Profile = () => {
  const { user, signOut, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [points, setPoints] = useState(0);
  const [watchStats, setWatchStats] = useState<WatchStats>({ videosWatched: 0, completed: 0, minutesWatched: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    const [profileRes, pointsRes, subscriptionRes, watchProgressRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      supabase.rpc('get_user_yogic_points', { _user_id: user.id }),
      supabase
        .from('subscriptions')
        .select('status, plan_type, end_date')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .maybeSingle(),
      supabase
        .from('watch_progress')
        .select('watched_seconds, completed')
        .eq('user_id', user.id),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (pointsRes.data !== null) setPoints(pointsRes.data);
    if (subscriptionRes.data) setSubscription(subscriptionRes.data);

    if (watchProgressRes.data) {
      const rows = watchProgressRes.data;
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
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground font-body mb-6">Sign in to view your profile</p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3.5 rounded-2xl gradient-gold text-primary-foreground font-semibold font-body shadow-glow active:scale-[0.98] transition-transform"
        >
          Sign In
        </button>
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || 'U';

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  const expiresDate = subscription?.end_date
    ? new Date(subscription.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const planLabel = subscription?.plan_type
    ? subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)
    : 'Free';

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
        <h1 className="font-heading text-2xl font-bold text-foreground">My Profile</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-body font-semibold">Log Out</span>
        </button>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-5"
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body">
            Profile Information
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
          {/* Avatar + Name header */}
          <div className="flex items-center gap-4 px-4 py-4 border-b border-border/50">
            <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center text-xl font-heading font-bold text-primary-foreground shadow-glow shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-foreground truncate">
                {profile?.full_name || 'Not set'}
              </p>
              <p className="text-sm text-muted-foreground font-body truncate">{user.email}</p>
              {hasActiveSubscription && <PremiumBadge />}
            </div>
          </div>

          {/* Info rows */}
          <InfoRow icon={UserIcon} label="Full Name" value={profile?.full_name || 'Not set'} />
          <InfoRow icon={Mail} label="Email" value={user.email || ''} />
          <InfoRow icon={Calendar} label="Member Since" value={memberSince} last />
        </div>
      </motion.div>

      {/* Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-2 px-1">
          Subscription
        </p>
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-accent" />
              <span className="text-sm font-body font-semibold text-foreground">
                {hasActiveSubscription ? 'Active' : 'Inactive'}
              </span>
            </div>
            {!hasActiveSubscription && (
              <button
                onClick={() => navigate('/subscribe')}
                className="text-xs font-body font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10 min-h-[36px]"
              >
                Upgrade
              </button>
            )}
          </div>
          {hasActiveSubscription && (
            <>
              <p className="text-sm text-muted-foreground font-body ml-7">
                Premium {planLabel}
              </p>
              {expiresDate && (
                <p className="text-xs text-muted-foreground/70 font-body ml-7 mt-0.5">
                  Expires: {expiresDate}
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Yogic Points */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-2 px-1">
          Yogic Points
        </p>
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-accent" />
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{points}</p>
              <p className="text-xs text-muted-foreground font-body">Earned from completing videos</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Your Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-2 px-1">
          Your Stats
        </p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Play} label="Videos Watched" value={watchStats.videosWatched} />
          <StatCard icon={CheckCircle} label="Completed" value={watchStats.completed} />
          <StatCard icon={Clock} label="Minutes Watched" value={watchStats.minutesWatched} />
        </div>
      </motion.div>

      {/* Help */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <button className="w-full flex items-center justify-between px-4 py-3.5 bg-card rounded-2xl border border-border/50 shadow-card hover:bg-secondary/50 transition-colors min-h-[48px]">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-body text-foreground">Help & Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </button>
      </motion.div>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        className="w-full text-center text-xs text-muted-foreground/50 font-body mt-6 py-2"
      >
        Tap to refresh
      </button>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, last }: { icon: React.ElementType; label: string; value: string; last?: boolean }) => (
  <div className={`flex items-center justify-between px-4 py-3.5 min-h-[48px] ${last ? '' : 'border-b border-border/50'}`}>
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-body text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-body text-foreground truncate max-w-[180px]">{value}</span>
  </div>
);

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
  <div className="bg-card rounded-2xl border border-border/50 shadow-card p-3 text-center">
    <Icon className="w-5 h-5 text-accent mx-auto mb-1" />
    <p className="text-lg font-heading font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground font-body">{label}</p>
  </div>
);

export default Profile;
