import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords, Flame } from 'lucide-react';
import { fetchRivalry, fetchRivalryHistory } from '@/lib/rivalries';
import { getSportDisplay } from '@/lib/constants';
import { format, formatDistanceToNow } from 'date-fns';
import { useGoBack } from '@/hooks/useGoBack';
import BackButton from '@/components/shared/BackButton';
import ChallengeFromProfileSheet from '@/components/profile/ChallengeFromProfileSheet';

export default function Rivalry() {
  const { rivalryId } = useParams();
  const goBack = useGoBack();
  const [rivalry, setRivalry] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetchRivalry(rivalryId);
        if (cancelled) return;
        setRivalry(r);
        if (r) {
          const h = await fetchRivalryHistory(r.user_a_id, r.user_b_id);
          if (!cancelled) setHistory(h);
        }
      } catch { /* */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rivalryId]);

  if (loading) return (
    <div className="px-4 space-y-4 pt-4">
      <Skeleton className="w-full h-40 rounded-3xl" />
      <Skeleton className="w-full h-20 rounded-2xl" />
      <Skeleton className="w-full h-20 rounded-2xl" />
    </div>
  );

  if (!rivalry) return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <p className="text-muted-foreground">Rivalry not found.</p>
      <Button variant="secondary" className="mt-4 rounded-full" onClick={goBack}>Go Back</Button>
    </div>
  );

  const userA = { id: rivalry.user_a_id, name: rivalry.user_a_name, avatar: rivalry.user_a_avatar, wins: rivalry.user_a_wins || 0 };
  const userB = { id: rivalry.user_b_id, name: rivalry.user_b_name, avatar: rivalry.user_b_avatar, wins: rivalry.user_b_wins || 0 };
  const totalGames = rivalry.total_games || 0;
  const draws = rivalry.draws || 0;
  const isTied = userA.wins === userB.wins;
  const streakName = rivalry.current_streak_user_id === userA.id ? userA.name
    : rivalry.current_streak_user_id === userB.id ? userB.name : null;

  const challengeOpponent = async (opp) => {
    const profiles = await base44.entities.Profile.filter({ created_by_id: opp.id });
    const p = profiles?.[0];
    setOpponentProfile({ id: opp.id, name: opp.name, username: p?.username || '' });
    setShowChallenge(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center px-4 pt-3 pb-2">
        <BackButton fallback="/" className="-ml-1 text-foreground" />
        <span className="font-heading font-bold ml-1">Rivalry</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {/* Hero card */}
        <div className="brand-gradient rounded-3xl p-5 text-white arena-shadow relative overflow-hidden mb-4">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Swords className="w-5 h-5" />
              <span className="font-heading font-extrabold text-sm uppercase tracking-wider">
                {isTied ? 'Dead Even' : 'Head to Head'}
              </span>
            </div>
            <p className="text-center text-[10px] uppercase tracking-widest opacity-70 mb-4">Who's On Top?</p>

            <div className="flex items-center justify-around text-center mb-4">
              <Link to={`/profile/${userA.name?.toLowerCase().replace(/\s/g, '')}`} className="flex flex-col items-center gap-1">
                <Avatar className="w-16 h-16 border-2 border-white/40">
                  <AvatarImage src={userA.avatar} />
                  <AvatarFallback className="bg-white/20 text-white text-xl">{userA.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <p className="font-heading font-bold text-sm mt-1">{userA.name}</p>
                <p className="font-heading font-extrabold text-2xl">{userA.wins}</p>
                <p className="text-[9px] uppercase opacity-70">Wins</p>
              </Link>
              <div className="flex flex-col items-center">
                <span className="font-heading text-xl font-bold opacity-60">{totalGames}</span>
                <span className="text-[9px] uppercase opacity-70">Games</span>
                {draws > 0 && <span className="text-[10px] opacity-60 mt-1">🤝 {draws} draws</span>}
              </div>
              <Link to={`/profile/${userB.name?.toLowerCase().replace(/\s/g, '')}`} className="flex flex-col items-center gap-1">
                <Avatar className="w-16 h-16 border-2 border-white/40">
                  <AvatarImage src={userB.avatar} />
                  <AvatarFallback className="bg-white/20 text-white text-xl">{userB.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <p className="font-heading font-bold text-sm mt-1">{userB.name}</p>
                <p className="font-heading font-extrabold text-2xl">{userB.wins}</p>
                <p className="text-[9px] uppercase opacity-70">Wins</p>
              </Link>
            </div>

            {isTied && (
              <p className="text-center font-heading font-bold text-sm mb-3">🔥 Nobody is on top</p>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1 rounded-full text-xs" onClick={() => challengeOpponent(userA)}>
                <Swords className="w-3 h-3 mr-1" /> Challenge {userA.name?.split(' ')[0]}
              </Button>
              <Button size="sm" variant="secondary" className="flex-1 rounded-full text-xs" onClick={() => challengeOpponent(userB)}>
                <Swords className="w-3 h-3 mr-1" /> Challenge {userB.name?.split(' ')[0]}
              </Button>
            </div>
          </div>
        </div>

        {/* Current streak */}
        {streakName && (rivalry.current_streak_count || 0) > 1 && (
          <div className="bg-card rounded-2xl border border-border/50 p-3 mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" />
            <p className="text-sm font-semibold">{streakName} is on a {rivalry.current_streak_count} game win streak</p>
          </div>
        )}

        {/* Last matchup */}
        {rivalry.last_game_at && (
          <div className="bg-card rounded-2xl border border-border/50 p-3 mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Last Matchup</p>
            <p className="text-sm font-semibold">{rivalry.last_game_summary || 'Result recorded'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(rivalry.last_game_at), { addSuffix: true })}</p>
          </div>
        )}

        {/* History */}
        <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-2 mt-4">History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No games recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((c, i) => {
              const display = getSportDisplay(c);
              const winnerName = c.is_draw ? 'Draw' : c.winner_name || '—';
              const gameNum = history.length - i;
              return (
                <div key={c.id} className="bg-card rounded-2xl border border-border/50 p-3 flex items-center gap-3">
                  <span className="text-xl">{display.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      Game {gameNum} — {winnerName}{c.is_draw ? '' : ' W'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {display.label}{c.score_text ? ` · ${c.score_text}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(c.completed_at || c.updated_date), 'MMM d')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {opponentProfile && (
        <ChallengeFromProfileSheet
          open={showChallenge}
          onOpenChange={setShowChallenge}
          opponentId={opponentProfile.id}
          opponentName={opponentProfile.name}
          opponentUsername={opponentProfile.username}
        />
      )}
    </div>
  );
}