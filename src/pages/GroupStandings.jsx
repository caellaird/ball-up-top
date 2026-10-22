import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSportDisplay } from '@/lib/constants';
import { computeGroupStandings } from '@/lib/groupStandings';
import { isGroupChallenge } from '@/lib/challengeGroup';
import ListSkeleton from '@/components/shared/ListSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { MessageCircle, Crown, Trophy } from 'lucide-react';
import { toast } from 'sonner';

// Central dashboard for a group (multiplayer) challenge: auto-calculates each
// participant's win-loss-draw record and ranks them into a league/tournament
// table. Includes a dedicated group chat for everyone in the challenge.
export default function GroupStandings() {
  const { challengeId } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [games, setGames] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    load();
  }, [challengeId]);

  const load = async () => {
    setLoading(true);
    try {
      const c = await base44.entities.Challenge.get(challengeId);
      setChallenge(c);

      let g = [];
      if (c.series_type !== 'single') {
        g = await base44.entities.SeriesGame.filter({ challenge_id: challengeId }, 'game_number');
      }
      setGames(g);

      // Fetch each participant's profile (avatar) for the standings table.
      const opponentIds = c.opponent_ids?.length ? c.opponent_ids : [c.opponent_id];
      const ids = [c.created_by_id, ...opponentIds].filter(Boolean);
      const lists = await Promise.all(
        ids.map((id) => base44.entities.Profile.filter({ created_by_id: id }))
      );
      const map = {};
      ids.forEach((id, i) => {
        map[id] = lists[i]?.[0]?.avatar_url || '';
      });
      setProfiles(map);
    } catch (e) {
      // leave challenge null to show error state
    } finally {
      setLoading(false);
    }
  };

  const openGroupChat = async () => {
    if (!challenge || openingChat) return;
    setOpeningChat(true);
    try {
      // Reuse an existing chat thread linked to this challenge if one exists.
      const existing = await base44.entities.Thread.filter({ challenge_id: challenge.id });
      if (existing[0]) {
        navigate(`/messages/${existing[0].id}`);
        return;
      }
      const opponentIds = challenge.opponent_ids?.length ? challenge.opponent_ids : [challenge.opponent_id];
      const opponentNames = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
      const thread = await base44.entities.Thread.create({
        type: 'group',
        name: challenge.group_name || `${challenge.creator_name}'s League`,
        challenge_id: challenge.id,
        participant_ids: [challenge.created_by_id, ...opponentIds],
        participant_names: [challenge.creator_name, ...opponentNames],
        admin_ids: [challenge.created_by_id],
      });
      navigate(`/messages/${thread.id}`);
    } catch (e) {
      toast.error('Could not open group chat');
      setOpeningChat(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Standings" backFallback="/groups" />
        <div className="p-4"><ListSkeleton count={4} /></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div>
        <Header title="Standings" backFallback="/groups" />
        <EmptyState title="Challenge not found" description="This group challenge may have been deleted." />
      </div>
    );
  }

  const sportDisplay = getSportDisplay(challenge);
  const standings = computeGroupStandings(challenge, games);
  const isSeries = challenge.series_type !== 'single';
  const leader = standings[0];
  const hasResults = standings.some((s) => s.games > 0);

  const statusBadge = {
    pending: '⏳ Pending',
    accepted: '🔥 In Progress',
    completed: '✅ Complete',
    declined: 'Declined',
    cancelled: 'Cancelled',
  }[challenge.status] || challenge.status;

  return (
    <div>
      <Header title="Standings" backFallback="/groups" />
      <div className="p-4 space-y-4">
        {/* Header card */}
        <div className="bg-card rounded-3xl shadow-sm p-5 text-center">
          <span className="text-4xl">{sportDisplay.emoji}</span>
          <h1 className="font-heading text-xl font-bold mt-1 break-words leading-tight">
            {challenge.group_name || `${challenge.creator_name}'s League`}
          </h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {sportDisplay.label} · {isSeries ? challenge.series_type : 'Single Game'}
          </p>
          <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
            {statusBadge}
          </span>
          {isSeries && hasResults && (
            <p className="text-xs text-muted-foreground mt-2">
              {games.length} game{games.length !== 1 ? 's' : ''} played
            </p>
          )}
        </div>

        {/* Standings table */}
        <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <Trophy className="w-4 h-4 text-accent" />
            <h2 className="font-heading font-bold">Rankings</h2>
          </div>
          <div className="grid grid-cols-[28px_1fr_44px_44px_44px_52px] gap-1 px-4 pb-2 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            <span>#</span>
            <span>Player</span>
            <span className="text-center">W</span>
            <span className="text-center">L</span>
            <span className="text-center">D</span>
            <span className="text-center">Pts</span>
          </div>
          <div className="divide-y divide-border">
            {standings.map((s) => {
              const isLeader = s.rank === 1 && s.points > 0;
              return (
                <div
                  key={s.user_id}
                  className={`grid grid-cols-[28px_1fr_44px_44px_44px_52px] gap-1 items-center px-4 py-2.5 ${isLeader ? 'bg-accent/5' : ''}`}
                >
                  <span className={`text-sm font-bold ${isLeader ? 'text-accent' : 'text-muted-foreground'}`}>
                    {isLeader ? <Crown className="w-4 h-4 text-accent" /> : s.rank}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={profiles[s.user_id]} />
                      <AvatarFallback>{s.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {s.name}
                      {s.user_id === user.id && <span className="text-muted-foreground font-normal"> (you)</span>}
                    </span>
                  </div>
                  <span className="text-center text-sm font-semibold">{s.wins}</span>
                  <span className="text-center text-sm text-muted-foreground">{s.losses}</span>
                  <span className="text-center text-sm text-muted-foreground">{s.draws}</span>
                  <span className="text-center text-sm font-heading font-bold">{s.points}</span>
                </div>
              );
            })}
          </div>
          {!hasResults && (
            <p className="text-center text-xs text-muted-foreground py-4 px-4">
              No games logged yet. Standings update automatically as results come in.
            </p>
          )}
        </div>

        {/* Recent games (series only) */}
        {isSeries && games.length > 0 && (
          <div className="bg-card rounded-3xl shadow-sm p-4">
            <h3 className="font-heading font-bold mb-3">Recent Games</h3>
            <div className="space-y-2">
              {games.slice().reverse().map((g) => (
                <div key={g.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Game {g.game_number}</span>
                  <span className="font-medium truncate ml-2">
                    {g.is_draw ? 'Draw 🤝' : g.winner_name ? `👑 ${g.winner_name}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={openGroupChat}
          disabled={openingChat}
          className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {openingChat ? 'Opening...' : 'Group Chat'}
        </Button>
      </div>
    </div>
  );
}