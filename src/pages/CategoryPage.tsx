import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

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
  categories?: { name: string } | null;
}

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      const [catRes, vidRes] = await Promise.all([
        supabase.from('categories').select('id, name, thumbnail_url').eq('id', id).single(),
        supabase
          .from('videos')
          .select('id, title, thumbnail_url, duration_seconds, is_premium, yogic_points, categories(name)')
          .eq('is_published', true)
          .eq('category_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (catRes.data) setCategory(catRes.data);
      if (vidRes.data) setVideos(vidRes.data as unknown as Video[]);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const formatDuration = (s?: number) => (s ? `${Math.floor(s / 60)} min` : undefined);

  return (
    <div className="pb-4">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden">
        {category?.thumbnail_url ? (
          <img src={category.thumbnail_url} alt={category.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-gold-light" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 to-background" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 safe-top w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-background" />
        </button>
        <div className="absolute bottom-4 left-5">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-2xl font-bold text-background"
          >
            {category?.name || 'Category'}
          </motion.h1>
          <p className="text-background/70 text-xs font-body mt-0.5">
            {videos.length} {videos.length === 1 ? 'class' : 'classes'}
          </p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
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
                  />
                </motion.div>
              ))}
        </div>

        {!loading && videos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body">No classes in this category yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
