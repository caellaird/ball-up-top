import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { SPORT_EMOJI } from '@/lib/constants';

export default function ChallengeCard({ challenge }) {
  return (
    <Link to={`/challenges/${challenge.id}`} className="block bg-card rounded-3xl shadow-sm p-4 mb-3 mx-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{SPORT_EMOJI[challenge.sport] || '🏆'}</span>
          <h3 className="font-heading font-bold">vs {challenge.opponent_name}</h3>
        </div>
        {challenge.status === 'completed' && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${challenge.winner_name ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
            {challenge.score_creator ?? 0}-{challenge.score_opponent ?? 0}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {challenge.location_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{challenge.location_name}</span>}
        {challenge.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(challenge.scheduled_time), 'MMM d, h:mm a')}</span>}
      </div>
    </Link>
  );
}