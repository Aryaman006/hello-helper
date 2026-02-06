import { Calendar, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface LiveSessionCardProps {
  title: string;
  instructor: string;
  date: string;
  time: string;
  attendees?: number;
  isLive?: boolean;
  onJoin?: () => void;
}

const LiveSessionCard = ({ title, instructor, date, time, attendees, isLive, onJoin }: LiveSessionCardProps) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    className="rounded-2xl p-4 shadow-card bg-card border border-border/50"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              Live
            </span>
          )}
          <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground font-body">with {instructor}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {time}
          </span>
          {attendees !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {attendees}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onJoin}
        className="shrink-0 ml-3 px-4 py-2 rounded-xl gradient-gold text-primary-foreground text-sm font-semibold font-body shadow-glow transition-all active:scale-95"
      >
        {isLive ? 'Join' : 'Book'}
      </button>
    </div>
  </motion.div>
);

export default LiveSessionCard;
