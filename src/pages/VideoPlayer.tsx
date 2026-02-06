import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Lock,
  Sparkles,
  Crown,
  Heart,
  HeartOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_seconds: number;
  is_premium: boolean;
  yogic_points: number;
  categories?: { name: string } | null;
}

interface WatchProgress {
  watched_seconds: number;
  completed: boolean;
}

const VideoPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [initialProgress, setInitialProgress] = useState(0);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch video data, access check, progress, and wishlist status
  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      setLoading(true);

      const { data: videoData } = await supabase
        .from('videos')
        .select('id, title, description, video_url, thumbnail_url, duration_seconds, is_premium, yogic_points, categories(name)')
        .eq('id', id)
        .single();

      if (!videoData) {
        toast.error('Video not found');
        navigate(-1);
        return;
      }

      setVideo(videoData as unknown as VideoData);

      // Check access
      if (!videoData.is_premium) {
        setHasAccess(true);
      } else if (user) {
        const { data: hasSub } = await supabase.rpc('has_active_subscription', { _user_id: user.id });
        setHasAccess(!!hasSub);
      }

      // Fetch watch progress
      if (user) {
        const [progressRes, wishlistRes] = await Promise.all([
          supabase
            .from('watch_progress')
            .select('watched_seconds, completed')
            .eq('user_id', user.id)
            .eq('video_id', id)
            .maybeSingle(),
          supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', user.id)
            .eq('video_id', id)
            .maybeSingle(),
        ]);

        if (progressRes.data) {
          setInitialProgress(progressRes.data.watched_seconds);
          setPointsAwarded(progressRes.data.completed);
        }
        setIsWishlisted(!!wishlistRes.data);
      }

      setLoading(false);
    };

    fetchAll();
  }, [id, user, navigate]);

  // Set initial seek position when video metadata loads
  const handleLoadedMetadata = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    setDuration(vid.duration);
    if (initialProgress > 0 && initialProgress < vid.duration - 5) {
      vid.currentTime = initialProgress;
      toast.info('Resuming where you left off');
    }
  }, [initialProgress]);

  // Save progress periodically
  const saveProgress = useCallback(async () => {
    if (!user || !id || !videoRef.current) return;
    const watched = Math.floor(videoRef.current.currentTime);
    const completed = videoRef.current.duration > 0 && watched >= videoRef.current.duration - 5;

    await supabase.from('watch_progress').upsert({
      user_id: user.id,
      video_id: id,
      watched_seconds: watched,
      completed,
      last_watched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' });

    // Award points on first completion
    if (completed && !pointsAwarded) {
      setPointsAwarded(true);
      try {
        await supabase.functions.invoke('award-yogic-points', {
          body: { user_id: user.id, video_id: id },
        });
        toast.success(`+${video?.yogic_points || 0} Yogic Points earned! 🎉`, {
          icon: <Sparkles className="w-4 h-4 text-primary" />,
        });
      } catch {
        // Points may have already been awarded
      }
    }
  }, [user, id, pointsAwarded, video?.yogic_points]);

  // Start/stop progress saving interval
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(saveProgress, 10000);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, saveProgress]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
    resetControlsTimer();
  };

  const skip = (seconds: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + seconds));
    resetControlsTimer();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
    resetControlsTimer();
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    saveProgress();
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('video-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleScreenTap = () => {
    resetControlsTimer();
  };

  const toggleWishlist = async () => {
    if (!user || !id) {
      toast.error('Sign in to save videos');
      return;
    }

    if (isWishlisted) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('video_id', id);
      setIsWishlisted(false);
      toast('Removed from wishlist');
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, video_id: id });
      setIsWishlisted(true);
      toast.success('Added to wishlist ❤️');
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl gradient-gold animate-pulse shadow-glow" />
      </div>
    );
  }

  if (!video) return null;

  // Premium locked state
  if (video.is_premium && !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative h-64">
          {video.thumbnail_url && (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <Lock className="w-12 h-12 text-background/80" />
          </div>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 safe-top w-10 h-10 rounded-full bg-foreground/40 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-background" />
          </button>
        </div>
        <div className="px-5 py-6">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-xs font-body font-semibold text-primary uppercase tracking-wider">Premium Content</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">{video.title}</h1>
          {video.description && (
            <p className="text-sm text-muted-foreground font-body mb-6">{video.description}</p>
          )}
          <button
            onClick={() => navigate('/subscribe')}
            className="w-full py-3.5 rounded-2xl gradient-gold text-primary-foreground font-semibold font-body text-base shadow-glow active:scale-[0.98] transition-transform"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      {/* Video Player */}
      <div
        id="video-container"
        className="relative w-full aspect-video bg-black flex-shrink-0"
        onClick={handleScreenTap}
      >
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumbnail_url}
          className="w-full h-full object-contain"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 flex flex-col justify-between"
            >
              {/* Top bar */}
              <div className="flex items-center gap-3 p-4 safe-top">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-heading text-sm font-semibold truncate">{video.title}</h2>
                  {video.categories?.name && (
                    <p className="text-white/60 text-xs font-body">{video.categories.name}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                >
                  <Maximize className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Center play controls */}
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={(e) => { e.stopPropagation(); skip(-10); }}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center shadow-glow active:scale-90 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-primary-foreground" />
                  ) : (
                    <Play className="w-7 h-7 text-primary-foreground ml-1" />
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); skip(10); }}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                >
                  <RotateCw className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Bottom progress */}
              <div className="px-4 pb-4">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 appearance-none bg-white/20 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(42, 87%, 68%) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-white/70 text-xs font-body">{formatTime(currentTime)}</span>
                  <span className="text-white/70 text-xs font-body">{formatTime(duration)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Info (below player) */}
      <div className="flex-1 bg-background rounded-t-3xl -mt-4 relative z-10 px-5 pt-6 pb-24">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-foreground mb-1">{video.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
              {video.categories?.name && <span>{video.categories.name}</span>}
              {video.duration_seconds > 0 && <span>{Math.floor(video.duration_seconds / 60)} min</span>}
            </div>
          </div>
          <button
            onClick={toggleWishlist}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
          >
            {isWishlisted ? (
              <Heart className="w-5 h-5 text-destructive fill-destructive" />
            ) : (
              <Heart className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Points badge */}
        {video.yogic_points > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-3 flex items-center gap-3 mb-4"
          >
            <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-body">
                {pointsAwarded ? 'Points earned' : 'Complete to earn'}
              </p>
              <p className="text-lg font-heading font-bold text-foreground">
                {pointsAwarded ? '✓ ' : '+'}{video.yogic_points} pts
              </p>
            </div>
          </motion.div>
        )}

        {/* Description */}
        {video.description && (
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{video.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
