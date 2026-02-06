import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LogOut, Crown, Sparkles, ChevronRight, Settings, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  full_name?: string;
  avatar_url?: string;
}

interface SubscriptionData {
  plan_type?: string;
  status?: string;
  end_date?: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const [profileRes, subRes, pointsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
        supabase.from('subscriptions').select('plan_type, status, end_date').eq('user_id', user.id).eq('status', 'active').single(),
        supabase.rpc('get_user_yogic_points', { p_user_id: user.id }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (subRes.data) setSubscription(subRes.data);
      if (pointsRes.data !== null) setPoints(pointsRes.data);
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground font-body mb-6">Sign in to view your profile</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 rounded-xl gradient-gold text-primary-foreground font-semibold font-body shadow-glow"
        >
          Sign In
        </button>
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || 'U';

  const isPremium = subscription?.plan_type === 'premium';

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-xl font-heading font-bold text-primary-foreground shadow-glow">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-foreground">
            {profile?.full_name || user.email?.split('@')[0]}
          </h1>
          <p className="text-sm text-muted-foreground font-body">{user.email}</p>
          {isPremium && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full gradient-gold text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              <Crown className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>
      </motion.div>

      {/* Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-body">Yogic Points</p>
          <p className="text-2xl font-heading font-bold text-foreground">{points}</p>
        </div>
      </motion.div>

      {/* Subscription */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4 mb-6 gradient-amber-cream border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-accent" />
            <h3 className="font-heading text-sm font-semibold text-foreground">Upgrade to Premium</h3>
          </div>
          <p className="text-xs text-muted-foreground font-body mb-3">
            Unlock all classes, live sessions, and exclusive content.
          </p>
          <button className="px-4 py-2 rounded-xl gradient-gold text-primary-foreground text-sm font-semibold font-body shadow-glow active:scale-95 transition-all">
            View Plans
          </button>
        </motion.div>
      )}

      {/* Menu */}
      <div className="space-y-1">
        {[
          { icon: Settings, label: 'Settings' },
          { icon: HelpCircle, label: 'Help & Support' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-body text-foreground">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="text-sm font-body text-destructive">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
