import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { getOrCreateStats } from '@/lib/ensureProfile';

// Personalized feed header — greets the user by first name and shows their
// live win/loss/streak summary pulled from real competition history.
export default function FeedPersonalHeader({ user }) {
  const reduce = useReducedMotion();
  const [stats, setStats] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    (async () => {
      // Sequential to avoid rate-limit bursts.
      const s = await getOrCreateStats(user);
      setStats(s);
      const mine = await base44.entities.Challenge.filter({ created_by_id: user.id }, '-created_date', 20);
      setActiveCount(mine.filter((c) => c.status === 'pending' || c.status === 'accepted').length);
    })();
  }, [user.id]);

  const firstName = user.full_name?.split(' ')[0] || 'Baller';
  const wins = stats?.games_won ?? 0;
  const losses = stats?.losses ?? 0;
  const streak = stats?.current_streak ?? 0;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={reduce ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="px-4 pb-3"
    >
      <h2 className="font-heading text-xl font-extrabold leading-tight">What's up, {firstName}?</h2>
      {stats ? (
        <p className="text-sm text-muted-foreground mt-0.5 flex items-center flex-wrap gap-1">
          <AnimatedNumber value={wins} className="font-heading font-bold text-foreground" />
          <span>wins</span>
          <span className="text-muted-foreground/40 mx-0.5">•</span>
          <AnimatedNumber value={losses} className="font-heading font-bold text-foreground" />
          <span>losses</span>
          {streak > 0 && (
            <>
              <span className="text-muted-foreground/40 mx-0.5">•</span>
              <AnimatedNumber value={streak} className="font-heading font-bold text-accent" />
              <span>game win streak 🔥</span>
            </>
          )}
        </p>
      ) : (
        <div className="h-5 w-52 rounded-full bg-muted animate-pulse mt-1.5" />
      )}
      {activeCount > 0 && (
        <Link to="/challenges" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary">
          {activeCount} active challenge{activeCount > 1 ? 's' : ''} →
        </Link>
      )}
    </motion.div>
  );
}