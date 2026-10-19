import React from 'react';

function RecordStat({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-lg leading-none mb-0.5">{icon}</span>
      <span className="font-heading font-extrabold text-lg leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-wide mt-0.5 leading-none text-[hsl(var(--muted-foreground))]">{label}</span>
    </div>);

}

export default function CompetitiveRecord({ stats }) {
  if (!stats) return null;

  const totalGames = stats.totalGames ?? stats.wins + stats.losses + stats.draws;
  const rivalriesWon = stats.rivalriesWon ?? 0;

  return (
    <div className="brand-gradient rounded-3xl p-4 text-white arena-shadow relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider">🏆 Competitive Record</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Who's On Top?</span>
        </div>
        <div className="grid grid-cols-4 gap-y-3 gap-x-2">
          <RecordStat icon="🏀" value={totalGames} label="Games" />
          <RecordStat icon="🏆" value={stats.wins} label="Wins" />
          <RecordStat icon="❌" value={stats.losses} label="Losses" />
          <RecordStat icon="📈" value={`${stats.winPct}%`} label="Win Rate" />
          <RecordStat icon="🔥" value={stats.currentStreak} label="Streak" />
          <RecordStat icon="⚔️" value={stats.challengesCompleted ?? 0} label="Challenges" />
          <RecordStat icon="🥇" value={rivalriesWon} label="Rivalries Won" />
          <RecordStat icon="👥" value={stats.uniqueOpponents ?? 0} label="Opponents" />
        </div>
      </div>
    </div>);

}