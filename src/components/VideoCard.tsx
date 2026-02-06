import { Play, Clock, Star } from 'lucide-react';
import PremiumBadge from './ui/PremiumBadge';
import { motion } from 'framer-motion';

interface VideoCardProps {
  title: string;
  thumbnail?: string;
  duration?: string;
  category?: string;
  isPremium?: boolean;
  progress?: number;
  onClick?: () => void;
}

const VideoCard = ({ title, thumbnail, duration, category, isPremium, progress, onClick }: VideoCardProps) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="w-full text-left rounded-2xl overflow-hidden shadow-card bg-card border border-border/50 group"
  >
    <div className="relative aspect-video bg-muted overflow-hidden">
      {thumbnail ? (
        <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full gradient-gold-light flex items-center justify-center">
          <Play className="w-8 h-8 text-primary-foreground/60" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
      {duration && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-foreground/70 text-background text-xs font-body">
          <Clock className="w-3 h-3" />
          {duration}
        </span>
      )}
      {isPremium && (
        <div className="absolute top-2 left-2">
          <PremiumBadge />
        </div>
      )}
      {typeof progress === 'number' && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
          <div className="h-full gradient-gold rounded-r-full" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
    <div className="p-3">
      <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-2 leading-tight">{title}</h3>
      {category && (
        <p className="text-xs text-muted-foreground mt-1 font-body">{category}</p>
      )}
    </div>
  </motion.button>
);

export default VideoCard;
