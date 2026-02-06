import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  LogOut, Crown, Sparkles, ChevronRight, Settings, HelpCircle,
  Camera, Play, CreditCard, Bell, Moon, Shield, Mail, User as UserIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PremiumBadge from '@/components/ui/PremiumBadge';

interface ProfileData {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

interface SettingRow {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
}

const Profile = () => {
  const { user, signOut, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [points, setPoints] = useState(0);
  const [videosWatched, setVideosWatched] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    const [profileRes, pointsRes, watchedRes] = await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url, phone').eq('user_id', user.id).maybeSingle(),
      supabase.rpc('get_user_yogic_points', { _user_id: user.id }),
      supabase.from('watch_history').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (pointsRes.data !== null) setPoints(pointsRes.data);
    if (watchedRes.count !== null) setVideosWatched(watchedRes.count);
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

  const accountSettings: SettingRow[] = [
    { icon: UserIcon, label: 'Edit Profile' },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Shield, label: 'Change Password' },
  ];

  const subscriptionSettings: SettingRow[] = [
    {
      icon: Crown,
      label: 'Subscription',
      value: hasActiveSubscription ? 'Premium' : 'Free',
      onClick: () => navigate('/subscribe'),
    },
    { icon: CreditCard, label: 'Payment History' },
  ];

  const preferenceSettings: SettingRow[] = [
    { icon: Bell, label: 'Notifications' },
    { icon: Moon, label: 'Appearance' },
    { icon: HelpCircle, label: 'Help & Support' },
    { icon: Settings, label: 'App Settings' },
  ];

  const SettingsSection = ({ title, items }: { title: string; items: SettingRow[] }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-2 px-1">
        {title}
      </p>
      <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden divide-y divide-border/50">
        {items.map(({ icon: Icon, label, value, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors min-h-[48px]"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-body text-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {value && <span className="text-xs text-muted-foreground font-body truncate max-w-[140px]">{value}</span>}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="flex justify-center mb-4">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Avatar + Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full gradient-gold flex items-center justify-center text-2xl font-heading font-bold text-primary-foreground shadow-glow">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border-2 border-background flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          {profile?.full_name || user.email?.split('@')[0]}
        </h1>
        <p className="text-sm text-muted-foreground font-body mb-1">{user.email}</p>
        {hasActiveSubscription && <PremiumBadge />}
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-3 text-center">
          <Sparkles className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-heading font-bold text-foreground">{points}</p>
          <p className="text-[10px] text-muted-foreground font-body">Yogic Points</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-3 text-center">
          <Play className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-heading font-bold text-foreground">{videosWatched}</p>
          <p className="text-[10px] text-muted-foreground font-body">Watched</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-3 text-center">
          <Crown className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-heading font-bold text-foreground">{hasActiveSubscription ? '✓' : '—'}</p>
          <p className="text-[10px] text-muted-foreground font-body">Premium</p>
        </div>
      </motion.div>

      {/* Upgrade Banner */}
      {!hasActiveSubscription && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/subscribe')}
          className="w-full rounded-2xl p-4 mb-6 gradient-gold flex items-center justify-between shadow-glow active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-primary-foreground" />
            <div className="text-left">
              <p className="text-sm font-semibold text-primary-foreground font-body">Upgrade to Premium</p>
              <p className="text-xs text-primary-foreground/70 font-body">Unlock all content</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary-foreground/70" />
        </motion.button>
      )}

      {/* Settings Sections */}
      <SettingsSection title="Account" items={accountSettings} />
      <SettingsSection title="Subscription" items={subscriptionSettings} />
      <SettingsSection title="Preferences" items={preferenceSettings} />

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2"
      >
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 hover:bg-destructive/15 transition-colors min-h-[48px]"
        >
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="text-sm font-body font-semibold text-destructive">Sign Out</span>
        </button>
      </motion.div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        className="w-full text-center text-xs text-muted-foreground/50 font-body mt-6 py-2"
      >
        Pull to refresh
      </button>
    </div>
  );
};

export default Profile;
