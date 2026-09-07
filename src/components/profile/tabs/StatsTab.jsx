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

export default function StatsTab({ wins, losses, draws, winPct, currentStreak, longestStreak, created, completed, topActivities, headToHead }) {
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

      <TrophyCase topActivities={topActivities} />

      {headToHead && (
        <HeadToHead
          currentUserId={headToHead.currentUserId}
          currentUserName={headToHead.currentUserName}
          profileOwnerId={headToHead.profileOwnerId}
          profileOwnerName={headToHead.profileOwnerName}
        />
      )}
    </div>
  );
}