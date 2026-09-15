import React from 'react';
import TrophyCase from '@/components/profile/TrophyCase';
import HeadToHead from '@/components/profile/HeadToHead';

function Stat({ label, value }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-3">
      <p className="font-heading text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

export default function StatsTab({ wins, losses, draws, winPct, currentStreak, longestStreak, created, completed, topActivities, sportsBreakdown, headToHead, awards, ownerId, ownerName, ownerUsername, ownerAvatar }) {
  const h2hProps = headToHead ? {
    currentUserId: headToHead.currentUserId,
    currentUserName: headToHead.currentUserName,
    profileOwnerId: headToHead.profileOwnerId,
    profileOwnerName: headToHead.profileOwnerName,
    profileOwnerAvatar: headToHead.profileOwnerAvatar,
    profileOwnerUsername: headToHead.profileOwnerUsername,
  } : null;
  return (
    <div className="px-4 pt-4 pb-6">
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Wins" value={wins} />
        <Stat label="Losses" value={losses} />
        <Stat label="Draws" value={draws ?? 0} />
        <Stat label="Win %" value={`${winPct}%`} />
        <Stat label="Streak" value={currentStreak} />
        <Stat label="Best Streak" value={longestStreak} />
        <Stat label="Created" value={created} />
        <Stat label="Completed" value={completed} />
      </div>

      <TrophyCase topActivities={topActivities} awards={awards} ownerId={ownerId} ownerName={ownerName} ownerUsername={ownerUsername} ownerAvatar={ownerAvatar} />

      {sportsBreakdown?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-heading font-bold mb-3">Competition Breakdown</h3>
          <div className="space-y-2">
            {sportsBreakdown.map((s) => (
              <div key={s.sport} className="bg-card rounded-2xl shadow-sm p-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span>
                  <span className="font-medium text-sm">{s.sport}</span>
                </span>
                <div className="text-right">
                  <p className="font-heading font-bold text-sm">
                    <span className="text-accent">{s.wins}</span>
                    <span className="text-muted-foreground mx-1">–</span>
                    <span className="text-secondary">{s.losses}</span>
                    {s.draws > 0 && <span className="text-muted-foreground ml-2 text-xs">🤝 {s.draws}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.games} games · {s.winPct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {h2hProps && <HeadToHead {...h2hProps} />}
    </div>
  );
}