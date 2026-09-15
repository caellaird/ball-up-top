import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Swords, Flame } from 'lucide-react';
import { fetchCurrentRival, getRival, getSelf, fetchRivalryHistory } from '@/lib/rivalries';
import { computeRivalryBreakdown } from '@/lib/rivalryBreakdown';
import { formatDistanceToNow } from 'date-fns';

export default function CurrentRival({ userId, profile, isSelf }) {
  const [rivalry, setRivalry] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCurrentRival(userId, profile)
      .then(async (r) => {
        if (cancelled) return;
        setRivalry(r);
        if (r && (r.total_games || 0) >= 1) {
          try {
            const history = await fetchRivalryHistory(r.user_a_id, r.user_b_id);
            if (!cancelled) setBreakdown(computeRivalryBreakdown(history, r.user_a_id, r.user_b_id));
          } catch { /* best-effort */ }
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, profile?.current_rival_id]);

  if (loading) return null;
  if (!rivalry) return null;

  const self = getSelf(rivalry, userId);
  const rival = getRival(rivalry, userId);
  const leadDiff = self.wins - rival.wins;
  const isTied = self.wins === rival.wins;
  const streakName = rivalry.current_streak_user_id === userId
    ? self.name
    : rivalry.current_streak_user_id === rival.id
      ? rival.name
      : null;

  // Most-played sport (from breakdown, computed from real data)
  const mostPlayed = breakdown?.mostPlayedSport;
  const mostPlayedSelfWins = mostPlayed
    ? (rivalry.user_a_id === userId ? mostPlayed.aWins : mostPlayed.bWins)
    : null;
  const mostPlayedRivalWins = mostPlayed
    ? (rivalry.user_a_id === userId ? mostPlayed.bWins : mostPlayed.aWins)
    : null;
  const mostPlayedLeader = mostPlayed && mostPlayedSelfWins !== mostPlayedRivalWins
    ? (mostPlayedSelfWins > mostPlayedRivalWins ? self.name.split(' ')[0] : rival.name.split(' ')[0])
    : null;

  return (
    <div className="bg-card rounded-3xl arena-shadow border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-primary" /> Current Rival
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {rivalry.total_games} Games
        </span>
      </div>

      <div className="flex items-center justify-around text-center mb-3">
        <div className="flex flex-col items-center gap-1">
          <Avatar className="w-12 h-12 border-2 border-primary/30">
            <AvatarImage src={self.avatar} />
            <AvatarFallback>{self.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <p className="font-heading font-bold text-sm">{self.wins}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[70px]">{self.name}</p>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-heading text-xs font-bold text-muted-foreground">VS</span>
          {rivalry.last_game_at && (
            <span className="text-[10px] text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(rivalry.last_game_at), { addSuffix: true })}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar className="w-12 h-12 border-2 border-accent/30">
            <AvatarImage src={rival.avatar} />
            <AvatarFallback>{rival.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <p className="font-heading font-bold text-sm">{rival.wins}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[70px]">{rival.name}</p>
        </div>
      </div>

      {/* Most-played sport line */}
      {mostPlayed && mostPlayed.totalGames >= 1 && (
        <div className="bg-muted/60 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
          <span className="text-lg">{mostPlayed.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Most Played</p>
            <p className="text-xs font-bold truncate">
              {mostPlayed.label} — {mostPlayedSelfWins}–{mostPlayedRivalWins}
              {mostPlayedLeader && <span className="text-muted-foreground font-medium"> {mostPlayedLeader}</span>}
            </p>
          </div>
        </div>
      )}

      <div className="text-center mb-3">
        {isTied ? (
          <p className="text-xs font-semibold text-muted-foreground">🔥 Dead even — nobody's on top</p>
        ) : (
          <p className="text-xs font-semibold text-muted-foreground">
            {leadDiff > 0 ? `${self.name} leads by ${leadDiff}` : `${rival.name} leads by ${Math.abs(leadDiff)}`}
          </p>
        )}
        {streakName && rivalry.current_streak_count > 1 && (
          <p className="text-xs text-accent font-semibold mt-0.5 flex items-center justify-center gap-0.5">
            <Flame className="w-3 h-3" /> {streakName} W{rivalry.current_streak_count}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="flex-1 rounded-full text-xs"
        >
          <Link to={`/rivalry/${rivalry.id}`}>View Rivalry</Link>
        </Button>
        {!isSelf && (
          <Button
            size="sm"
            className="flex-1 rounded-full text-xs"
            onClick={() => navigate(`/profile/${rival.name?.toLowerCase().replace(/\s/g, '')}`)}
          >
            <Swords className="w-3 h-3 mr-1" /> Challenge
          </Button>
        )}
      </div>
    </div>
  );
}