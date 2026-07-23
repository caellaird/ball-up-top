import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function HeadToHead({ currentUserId, currentUserName, profileOwnerId, profileOwnerName }) {
  const [record, setRecord] = useState(null);

  useEffect(() => {
    load();
  }, [currentUserId, profileOwnerId]);

  const load = async () => {
    const [asCreator, asOpponent] = await Promise.all([
      base44.entities.Challenge.filter({ created_by_id: currentUserId, opponent_id: profileOwnerId, status: 'completed' }),
      base44.entities.Challenge.filter({ created_by_id: profileOwnerId, opponent_id: currentUserId, status: 'completed' }),
    ]);
    const all = [...asCreator, ...asOpponent];
    const wins = all.filter((c) => c.winner_id === currentUserId).length;
    const losses = all.filter((c) => c.winner_id === profileOwnerId).length;
    const ties = all.length - wins - losses;
    setRecord({ total: all.length, wins, losses, ties });
  };

  if (!record || record.total === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-heading font-bold mb-3">Head-to-Head</h3>
      <div className="bg-card rounded-2xl shadow-sm p-4 flex items-center justify-around text-center">
        <div>
          <p className="font-heading text-lg font-bold text-accent">{record.wins}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Your Wins</p>
        </div>
        <div>
          <p className="font-heading text-lg font-bold">{record.total}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Games</p>
        </div>
        <div>
          <p className="font-heading text-lg font-bold text-secondary">{record.losses}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{profileOwnerName}'s Wins</p>
        </div>
      </div>
    </div>
  );
}