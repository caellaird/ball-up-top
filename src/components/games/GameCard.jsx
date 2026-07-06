import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function GameCard({ game }) {
  return (
    <Link to={`/games/${game.id}`} className="block bg-card border border-border rounded-xl p-4 mb-3 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{game.title}</h3>
        <Badge variant={game.status === 'open' ? 'default' : 'secondary'}>{game.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{game.location_name}</span>
        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(game.start_time), 'MMM d, h:mm a')}</span>
        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{game.current_player_count}/{game.max_players}</span>
      </div>
    </Link>
  );
}