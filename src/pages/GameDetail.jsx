import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { getOrCreateStats } from '@/lib/ensureProfile';

export default function GameDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [game, setGame] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    const g = await base44.entities.Game.get(id);
    setGame(g);
    const p = await base44.entities.GameParticipant.filter({ game_id: id });
    setParticipants(p);
    setJoined(p.some((x) => x.created_by_id === user.id));
  };

  const join = async () => {
    const p = await base44.entities.GameParticipant.create({ game_id: id, user_name: user.full_name });
    const updated = await base44.entities.Game.update(id, { current_player_count: (game.current_player_count || 0) + 1 });
    setGame(updated);
    setJoined(true);
    setParticipants([...participants, p]);
  };

  const logResult = async () => {
    const stats = await getOrCreateStats(user);
    await base44.entities.UserStats.update(stats.id, { games_played: (stats.games_played || 0) + 1, games_won: (stats.games_won || 0) + 1 });
    const updated = await base44.entities.Game.update(id, { status: 'completed' });
    setGame(updated);
  };

  if (!game) return <div className="text-center text-muted-foreground py-10">Loading game...</div>;

  const isCreator = game.created_by_id === user.id;

  return (
    <div>
      <h1 className="font-heading text-2xl mb-2">{game.title}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{game.location_name}</span>
        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(game.start_time), 'MMM d, h:mm a')}</span>
        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{game.current_player_count}/{game.max_players}</span>
      </div>
      {game.description && <p className="text-sm mb-6">{game.description}</p>}
      <div className="flex gap-3 mb-8">
        {!joined && game.status === 'open' && <Button onClick={join} className="rounded-full">Join Game</Button>}
        {isCreator && game.status === 'open' && <Button onClick={logResult} variant="secondary" className="rounded-full">Mark Completed</Button>}
      </div>
      <h3 className="font-semibold mb-3">Players ({participants.length})</h3>
      <div className="space-y-2">
        {participants.map((p, i) => (
          <div key={p.id || i} className="text-sm bg-muted rounded-lg px-3 py-2">{p.user_name}</div>
        ))}
      </div>
    </div>
  );
}