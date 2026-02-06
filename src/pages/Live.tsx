import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import LiveSessionCard from '@/components/LiveSessionCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { Radio } from 'lucide-react';

interface LiveSession {
  id: string;
  title: string;
  instructor_name?: string;
  scheduled_at: string;
  duration_minutes?: number;
  max_participants?: number;
}

const Live = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('live_sessions')
      .select('*')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (data) setSessions(data);
        setLoading(false);
      });
  }, []);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
          <Radio className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Live Classes</h1>
      </div>

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} className="h-24 rounded-2xl" />
            ))
          : sessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <LiveSessionCard
                  title={s.title}
                  instructor={s.instructor_name || 'Instructor'}
                  date={formatDate(s.scheduled_at)}
                  time={formatTime(s.scheduled_at)}
                  attendees={s.max_participants}
                />
              </motion.div>
            ))}
      </div>

      {!loading && sessions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full gradient-gold-light flex items-center justify-center mb-4">
            <Radio className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">No upcoming sessions</h3>
          <p className="text-sm text-muted-foreground font-body">Check back soon for live classes</p>
        </div>
      )}
    </div>
  );
};

export default Live;
