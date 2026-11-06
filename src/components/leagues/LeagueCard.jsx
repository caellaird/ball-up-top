import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Users, CalendarDays } from 'lucide-react';
import { getSportDisplay } from '@/lib/constants';

export default function LeagueCard({ league, nextSession }) {
  const sport = getSportDisplay(league);
  const memberCount = league.members?.length || 0;

  return (
    <Link to={`/leagues/${league.id}`} className="block bg-card rounded-3xl p-4 shadow-sm active:scale-[0.99] transition">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">
          {sport.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold truncate">{league.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {sport.label} · <Users className="inline w-3 h-3 -mt-0.5" /> {memberCount} {memberCount === 1 ? 'player' : 'players'}
          </p>
        </div>
      </div>
      {league.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{league.description}</p>
      )}
      <p className="text-xs font-semibold text-primary mt-3 flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5" />
        {nextSession
          ? `Next up · ${format(new Date(nextSession.start_time), 'EEE, MMM d · h:mm a')}`
          : 'No times scheduled yet'}
      </p>
    </Link>
  );
}