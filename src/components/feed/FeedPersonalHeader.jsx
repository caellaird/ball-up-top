import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { getCachedProfileStats } from '@/lib/ensureProfile';
import { isPendingChallengeExpired } from '@/lib/challengeExpiry';

// Personalized feed header — greets the user by first name and shows their
// live win/loss/streak summary pulled from real competition history.
export default function FeedPersonalHeader({ user }) {
  const reduce = useReducedMotion();
  const [stats, setStats] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    (async () => {
      // Use the same competitive-record computation the Profile uses (cached,
      // shared) so Home and Profile always show identical wins/losses/streak.
      const s = await getCachedProfileStats(user.id);
      setStats(s);
      // Same rule the Challenges page uses: both sides of a challenge count, and
      // a pending challenge that sat past its grace window is no longer active.
      const all = await base44.entities.Challenge.list('-created_date', 100);
      const mine = all.filter(
        (c) => c.created_by_id === user.id || c.opponent_id === user.id || c.opponent_ids?.includes(user.id)
      );
      setActiveCount(
        mine.filter((c) => c.status === 'accepted' || (c.status === 'pending' && !isPendingChallengeExpired(c))).length
      );
    })();
  }, [user.id]);

  const firstName = user.full_name?.split(' ')[0] || 'Baller';
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const streak = stats?.currentStreak ?? 0;

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