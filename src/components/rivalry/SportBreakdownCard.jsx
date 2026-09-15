import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronRight } from 'lucide-react';
import { useMotionVariants } from '@/lib/motion';

// A tappable card showing one sport/activity's head-to-head breakdown.
// userA / userB: { id, name } — used to label the streak.
export default function SportBreakdownCard({ sport, userA, userB, active, onClick }) {
  const { tapProps, reduce } = useMotionVariants();

  const total = sport.totalGames;
  const aPct = total > 0 ? sport.winRateA : 0;
  const bPct = total > 0 ? sport.winRateB : 0;
  const drawPct = total > 0 ? 100 - aPct - bPct : 0;

  const streakName = sport.currentStreakUserId === userA.id ? userA.name
    : sport.currentStreakUserId === userB.id ? userB.name : null;
  const isTied = sport.aWins === sport.bWins && total > 0;

  return (
    <motion.button
      onClick={onClick}
      {...tapProps}
      className={`w-full text-left rounded-2xl border p-3.5 transition-colors ${
        active
          ? 'border-primary bg-primary/5 arena-ring'
          : 'border-border/60 bg-card hover:border-border'
      }`}
    >
      {/* Header: emoji + sport name + games count */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sport.emoji}</span>
          <span className="font-heading font-bold text-sm">{sport.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            {total} {total === 1 ? 'Game' : 'Games'}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Head-to-head score */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{userA.name}</span>
          <span className="font-heading font-extrabold text-xl text-primary">{sport.aWins}</span>
        </div>
        <span className="text-xs font-bold text-muted-foreground">—</span>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{userB.name}</span>
          <span className="font-heading font-extrabold text-xl text-accent">{sport.bWins}</span>
        </div>
      </div>

      {/* Win rate bar */}
      {total > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden flex bg-muted mb-2">
          <div className="bg-primary transition-all" style={{ width: `${aPct}%` }} />
          {drawPct > 0 && <div className="bg-muted-foreground/30" style={{ width: `${drawPct}%` }} />}
          <div className="bg-accent transition-all" style={{ width: `${bPct}%` }} />
        </div>
      )}

      {/* Footer: win rate + streak */}
      <div className="flex items-center justify-between text-[11px]">
        {total > 0 ? (
          <span className="font-semibold text-muted-foreground">
            {sport.aWins > sport.bWins
              ? `${userA.name.split(' ')[0]} ${aPct}%`
              : sport.bWins > sport.aWins
                ? `${userB.name.split(' ')[0]} ${bPct}%`
                : 'Even'}
          </span>
        ) : (
          <span />
        )}
        {isTied ? (
          <span className="font-semibold">🤝 Series Tied</span>
        ) : streakName && sport.currentStreakCount >= 2 ? (
          <span className="flex items-center gap-0.5 font-semibold text-accent">
            <Flame className="w-3 h-3" />
            {streakName.split(' ')[0]} W{sport.currentStreakCount}
          </span>
        ) : null}
      </div>
    </motion.button>
  );
}