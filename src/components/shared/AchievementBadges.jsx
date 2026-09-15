import { motion, useReducedMotion } from 'framer-motion';

const MILESTONES = [
  { key: 'first_win', label: 'First Win', emoji: '🎉', check: (s) => s.wins >= 1 },
  { key: 'five_wins', label: '5 Wins', emoji: '🏆', check: (s) => s.wins >= 5 },
  { key: 'ten_wins', label: '10 Wins', emoji: '👑', check: (s) => s.wins >= 10 },
  { key: 'streak3', label: '3 Game Streak', emoji: '🔥', check: (s) => (s.longestStreak ?? s.currentStreak ?? 0) >= 3 },
  { key: 'streak5', label: '5 Game Streak', emoji: '⚡', check: (s) => (s.longestStreak ?? s.currentStreak ?? 0) >= 5 },
  { key: 'games10', label: '10 Games Played', emoji: '🎮', check: (s) => (s.wins + s.losses + (s.draws || 0)) >= 10 },
];

// Renders earned milestone badges with a staggered pop-in animation.
// `stats` should include wins, losses, draws, currentStreak, longestStreak.
export default function AchievementBadges({ stats, className }) {
  const reduce = useReducedMotion();
  if (!stats) return null;
  const earned = MILESTONES.filter((m) => m.check(stats));
  if (earned.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {earned.map((m, i) => (
        <motion.div
          key={m.key}
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={reduce ? {} : { opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border arena-shadow"
        >
          <span className="text-base leading-none">{m.emoji}</span>
          <span className="text-xs font-semibold">{m.label}</span>
        </motion.div>
      ))}
    </div>
  );
}