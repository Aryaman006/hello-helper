import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import VideoCard from '@/components/VideoCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { Heart, Clock } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  is_premium?: boolean;
  yogic_points?: number;
  categories?: { name: string };
}

const MyVideos = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'continue' | 'wishlist'>('continue');
  const [continueVideos, setContinueVideos] = useState<(Video & { progress: number })[]>([]);
  const [wishlistVideos, setWishlistVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [progressRes, wishlistRes] = await Promise.all([
        supabase
          .from('watch_progress')
          .select('watched_seconds, completed, last_watched_at, videos(id, title, thumbnail_url, duration_seconds, is_premium, yogic_points)')
          .eq('user_id', user.id)
          .order('last_watched_at', { ascending: false })
          .limit(10),
        supabase
          .from('wishlist')
          .select('id, videos(id, title, thumbnail_url, is_premium, yogic_points)')
          .eq('user_id', user.id)
          .limit(20),
      ]);

      if (progressRes.data) {
        setContinueVideos(
          progressRes.data
            .filter((d: any) => d.videos)
            .map((d: any) => ({
              ...d.videos,
              progress: d.videos.duration_seconds
                ? Math.round((d.watched_seconds / d.videos.duration_seconds) * 100)
                : 0,
            }))
        );
      }
      if (wishlistRes.data) {
        setWishlistVideos(wishlistRes.data.filter((d: any) => d.videos).map((d: any) => d.videos));
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const formatDuration = (s?: number) => s ? `${Math.floor(s / 60)} min` : undefined;
  // Note: duration field in Video is now duration_seconds
  const videos = tab === 'continue' ? continueVideos : wishlistVideos;

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-4">My Videos</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'continue' as const, label: 'Continue', icon: Clock },
          { key: 'wishlist' as const, label: 'Wishlist', icon: Heart },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-semibold transition-all ${
              tab === key
                ? 'gradient-gold text-primary-foreground shadow-glow'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {!user ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-body">Sign in to see your videos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} className="aspect-[4/3] rounded-2xl" />
              ))
            : videos.map((vid, i) => (
                <motion.div
                  key={vid.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <VideoCard
                    id={vid.id}
                    title={vid.title}
                    thumbnail={vid.thumbnail_url}
                    duration={formatDuration(vid.duration_seconds)}
                    category={vid.categories?.name}
                    isPremium={vid.is_premium}
                    progress={'progress' in vid ? (vid as any).progress : undefined}
                  />
                </motion.div>
              ))}
        </div>
      )}

      {!loading && user && videos.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full gradient-gold-light flex items-center justify-center mb-4">
            {tab === 'continue' ? <Clock className="w-8 h-8 text-accent" /> : <Heart className="w-8 h-8 text-accent" />}
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            {tab === 'continue' ? 'No videos in progress' : 'Wishlist is empty'}
          </h3>
          <p className="text-sm text-muted-foreground font-body">
            {tab === 'continue' ? 'Start watching to track progress' : 'Save videos to watch later'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyVideos;
