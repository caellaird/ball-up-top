import React from 'react';
// Sport display info (label + emoji) comes from profileStats via a.sport and a.emoji

export default function TrophyCase({ topActivities }) {
  if (!topActivities || topActivities.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="font-heading font-bold mb-3">Top Activities</h3>
        <p className="text-sm text-muted-foreground">No competitions yet. Complete a challenge to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="font-heading font-bold mb-3">Top Activities</h3>
      <div className="space-y-3">
        {topActivities.map((a) => (
          <div key={a.sport} className="bg-card rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{a.emoji || '🏆'}</span>
              <span className="font-heading font-bold">{a.sport}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <p className="font-heading text-base font-bold text-green-600">{a.wins}</p>
                <p className="text-[9px] text-muted-foreground uppercase">Wins</p>
              </div>
              <div>
                <p className="font-heading text-base font-bold text-red-500">{a.losses}</p>
                <p className="text-[9px] text-muted-foreground uppercase">Losses</p>
              </div>
              <div>
                <p className="font-heading text-base font-bold text-accent">{a.currentStreak}</p>
                <p className="text-[9px] text-muted-foreground uppercase">Streak</p>
              </div>
              <div>
                <p className="font-heading text-base font-bold">{a.winPct}%</p>
                <p className="text-[9px] text-muted-foreground uppercase">Win %</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}