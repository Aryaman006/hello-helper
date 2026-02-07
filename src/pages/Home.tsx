import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import heroImage from '@/assets/hero-yoga.jpg';

interface Category {
  id: string;
  name: string;
  thumbnail_url?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  is_premium?: boolean;
  yogic_points?: number;
  views_count?: number;
  categories?: { name: string } | null;
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, vidRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, thumbnail_url')
          .eq('is_featured', true)
          .order('sort_order')
          .limit(6),
        supabase
          .from('videos')
          .select('id, title, thumbnail_url, duration_seconds, is_premium, yogic_points, views_count, categories(name)')
          .eq('is_published', true)
          .order('views_count', { ascending: false })
          .limit(8),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (vidRes.data) setRecentVideos(vidRes.data as unknown as Video[]);

      if (user) {
        const [pointsRes, profileRes] = await Promise.all([
          supabase.rpc('get_user_yogic_points', { _user_id: user.id }),
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        ]);
        if (pointsRes.data !== null) setPoints(pointsRes.data);
        if (profileRes.data?.full_name) setProfileName(profileRes.data.full_name);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return undefined;
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  const firstName = profileName?.split(' ')[0] || user?.email?.split('@')[0] || 'Yogi';

  return (
    <div className="pb-4">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img src={heroImage} alt="Yoga practice" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-background" />
        <div className="absolute bottom-4 left-5 right-5">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-background/70 text-xs font-body uppercase tracking-widest mb-0.5"
          >
            Namaste
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-2xl font-bold text-background"
          >
            Hello, {firstName} 🙏
          </motion.h1>
        </div>
      </div>

      {/* Yogic Points */}
      <div className="px-5 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">Yogic Points</p>
              <p className="text-xl font-heading font-bold text-foreground">{points}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-success font-body font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            Keep going!
          </div>
        </motion.div>
      </div>

      {/* Categories */}
      <section className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Explore</h2>
          <button onClick={() => navigate('/browse')} className="text-xs text-accent font-body font-semibold flex items-center">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} className="shrink-0 w-24 h-28 rounded-2xl" />
              ))
            : categories.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/category/${cat.id}`)}
                  className="shrink-0 w-24 rounded-2xl overflow-hidden shadow-card border border-border/50 bg-card"
                >
                  <div className="h-16 gradient-gold-light flex items-center justify-center">
                    {cat.thumbnail_url ? (
                      <img src={cat.thumbnail_url} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🧘</span>
                    )}
                  </div>
                  <p className="text-xs font-body font-semibold text-foreground text-center py-2 px-1 truncate">
                    {cat.name}
                  </p>
                </motion.button>
              ))}
        </div>
      </section>

      {/* Recent Videos */}
      <section className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">For You</h2>
          <button onClick={() => navigate('/browse')} className="text-xs text-accent font-body font-semibold flex items-center">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} className="aspect-[4/3] rounded-2xl" />
              ))
            : recentVideos.slice(0, 6).map((vid, i) => (
                <motion.div
                  key={vid.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <VideoCard
                    id={vid.id}
                    title={vid.title}
                    thumbnail={vid.thumbnail_url}
                    duration={formatDuration(vid.duration_seconds)}
                    category={vid.categories?.name}
                    isPremium={vid.is_premium}
                  />
                </motion.div>
              ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
