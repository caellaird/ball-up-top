import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getSportDisplay } from '@/lib/constants';

export default function ChallengeCard({ challenge }) {
  const isSeries = challenge.series_type !== 'single';
  const sportDisplay = getSportDisplay(challenge);
  const opponentsLabel = challenge.opponent_names?.length > 1
    ? challenge.opponent_names.join(', ')
    : challenge.opponent_name;

  if (isSeries) {
    const creatorWins = challenge.creator_games_won || 0;
    const opponentWins = challenge.opponent_games_won || 0;
    const totalGames = challenge.games_to_win ? challenge.games_to_win * 2 - 1 : creatorWins + opponentWins + 1;
    const gameNumber = creatorWins + opponentWins + 1;
    const progress = totalGames ? Math.min(100, ((creatorWins + opponentWins) / totalGames) * 100) : 0;

    return (
      <Link
        to={`/challenges/${challenge.id}`}
        className="block rounded-3xl shadow-sm p-4 mb-3 mx-4 border border-border"
        style={{ background: 'linear-gradient(135deg, #d8dbe0, #eef0f2)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{sportDisplay.emoji}</span>
            <h3 className="font-heading font-bold text-[hsl(var(--accent))]">{challenge.series_name || 'Series'}</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[hsl(var(--accent))] text-white uppercase tracking-wide">Series</span>
        </div>
        <p className="text-sm font-semibold mb-2 break-words">
          <span className={challenge.winner_id === challenge.created_by_id ? 'text-accent font-bold' : 'text-muted-foreground'}>
            {challenge.winner_id === challenge.created_by_id ? '👑 ' : ''}{challenge.creator_name}
          </span>
          {' '}{creatorWins} — {opponentWins}{' '}
          <span className={challenge.winner_id === challenge.opponent_id ? 'text-accent font-bold' : 'text-muted-foreground'}>
            {challenge.winner_id === challenge.opponent_id ? '👑 ' : ''}{opponentsLabel}
          </span>
        </p>
        {challenge.status !== 'completed' && (
          <p className="text-xs text-muted-foreground mb-2">
            {challenge.games_to_win ? `Game ${gameNumber} of ${totalGames}` : `Game ${gameNumber}`}
          </p>
        )}
        {challenge.games_to_win && (
          <div className="w-full h-1.5 rounded-full bg-black/10 mb-2 overflow-hidden">
            <div className="h-full bg-[hsl(var(--accent))]" style={{ width: `${progress}%` }} />
          </div>
        )}
        {challenge.status === 'completed' && challenge.winner_name && (
          <p className="text-xs font-bold text-accent">👑 {challenge.winner_name} wins the series</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
          {challenge.location_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{challenge.location_name}</span>}
          {challenge.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(challenge.scheduled_time), 'MMM d, h:mm a')}</span>}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/challenges/${challenge.id}`} className="block bg-card rounded-3xl shadow-sm p-4 mb-3 mx-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">{sportDisplay.emoji}</span>
          <h3 className={`font-heading font-bold min-w-0 break-words ${challenge.winner_id === challenge.opponent_id ? 'text-accent' : ''}`}>
            {challenge.status === 'completed' && challenge.winner_id === challenge.created_by_id && '👑 '}
            vs {opponentsLabel}
            {challenge.status === 'completed' && challenge.winner_id === challenge.opponent_id && ' 👑'}
          </h3>
        </div>
        {challenge.status === 'completed' && (
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${challenge.winner_name ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
              {challenge.score_creator ?? 0}-{challenge.score_opponent ?? 0}
            </span>
            {challenge.winner_name && <span className="text-[10px] font-bold text-accent">👑 {challenge.winner_name}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {challenge.location_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{challenge.location_name}</span>}
        {challenge.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(challenge.scheduled_time), 'MMM d, h:mm a')}</span>}
      </div>
    </Link>
  );
}