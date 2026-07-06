import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import GameCard from '@/components/games/GameCard';
import CreateGameDialog from '@/components/games/CreateGameDialog';
import EmptyState from '@/components/shared/EmptyState';

export default function Games() {
  const [games, setGames] = useState(null);

  useEffect(() => {
    base44.entities.Game.list('-created_date', 50).then(setGames);
  }, []);

  if (games === null) return <div className="text-center text-muted-foreground py-10">Loading games...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Games</h1>
        <CreateGameDialog onCreated={(g) => setGames([g, ...games])} />
      </div>
      {games.length === 0 ? (
        <EmptyState title="No games near you" description="Create one and get the run started!" />
      ) : (
        games.map((g) => <GameCard key={g.id} game={g} />)
      )}
    </div>
  );
}