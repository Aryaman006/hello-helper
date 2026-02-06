import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search as SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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

const Browse = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('categories').select('id, name, thumbnail_url').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      let query = supabase
        .from('videos')
        .select('id, title, thumbnail_url, duration_seconds, is_premium, yogic_points, categories(name)')
        .eq('is_published', true);
      if (selectedCategory) query = query.eq('category_id', selectedCategory);
      if (search) query = query.ilike('title', `%${search}%`);
      query = query.order('created_at', { ascending: false });
      const { data } = await query.limit(20);
      if (data) setVideos(data as unknown as Video[]);
      setLoading(false);
    };
    fetchVideos();
  }, [selectedCategory, search]);

  const formatDuration = (s?: number) => s ? `${Math.floor(s / 60)} min` : undefined;

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Browse</h1>

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search classes..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary border border-border text-foreground text-sm font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-body font-semibold transition-all ${
            !selectedCategory
              ? 'gradient-gold text-primary-foreground shadow-glow'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-body font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'gradient-gold text-primary-foreground shadow-glow'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      <div className="grid grid-cols-2 gap-3 mt-2">
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
          <p className="text-muted-foreground font-body">No classes found</p>
        </div>
      )}
    </div>
  );
};

export default Browse;
