import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/layout/Header';
import EmptyState from '@/components/shared/EmptyState';
import CreateGroupSheet from '@/components/messages/CreateGroupSheet';
import NewDmSheet from '@/components/messages/NewDmSheet';
import { getOrCreateProfile, invalidateProfile } from '@/lib/ensureProfile';
import { MessageCircle, Users, Trophy } from 'lucide-react';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { formatDistanceToNow } from 'date-fns';
import { getSportDisplay } from '@/lib/constants';

export default function Groups({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const navigate = useNavigate();
  const [threads, setThreads] = useState(null);
  const [leagues, setLeagues] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showDm, setShowDm] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [tab, setTab] = useState('leagues');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const p = await getOrCreateProfile(user);
    setProfile(p);
    const all = await base44.entities.Thread.list('-last_message_at', 50);
    setThreads(all.filter((t) => t.participant_ids?.includes(user.id)));

    // Group challenges (multiplayer) the user is part of — these power the
    // league/tournament dashboard. One filtered call, then narrow to group
    // challenges client-side (the API can't express array length).
    try {
      const mine = await base44.entities.Challenge.filter(
        { $or: [{ created_by_id: user.id }, { opponent_ids: { $in: [user.id] } }] },
        { sort: '-created_date', limit: 50 }
      );
      setLeagues(mine.filter((c) => (c.opponent_ids?.length || 0) > 1));
    } catch {
      setLeagues([]);
    }
  };

  const toggleReady = async (checked) => {
    const updated = await base44.entities.Profile.update(profile.id, { ready_to_ball: checked });
    invalidateProfile(user.id);
    setProfile(updated);
  };

  return (
    <div>
      <Header title="Groups" />
      <div className="px-4 py-3 flex items-center justify-between bg-card mx-4 mt-4 rounded-2xl shadow-sm">
        <div>
          <p className="font-semibold text-sm">Ready to Ball</p>
          <p className="text-xs text-muted-foreground">Let friends know you're available</p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.ready_to_ball && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
          <Switch checked={!!profile?.ready_to_ball} onCheckedChange={toggleReady} />
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowDm(true)}
          className="flex flex-col items-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 shadow-sm hover:opacity-90 transition"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">New DM</span>
        </button>
        <button
          onClick={() => setShowGroup(true)}
          className="flex flex-col items-center gap-2 bg-secondary text-secondary-foreground rounded-2xl py-4 shadow-sm hover:opacity-90 transition"
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-semibold">New Group</span>
        </button>
      </div>

      <NewDmSheet
        open={showDm}
        onOpenChange={setShowDm}
        user={user}
        onCreated={(thread) => {
          setShowDm(false);
          navigate(`/messages/${thread.id}`);
        }}
      />
      <CreateGroupSheet
        open={showGroup}
        onOpenChange={setShowGroup}
        user={user}
        onCreated={(thread) => {
          setShowGroup(false);
          load();
          navigate(`/messages/${thread.id}`);
        }}
      />

      {/* Leagues / Chats toggle */}
      <div className="flex gap-1 mx-4 mt-5 mb-3 bg-muted/60 rounded-full p-1">
        <button
          onClick={() => setTab('leagues')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${tab === 'leagues' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
        >
          <Trophy className="w-4 h-4" /> Leagues
        </button>
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${tab === 'chats' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
        >
          <MessageCircle className="w-4 h-4" /> Chats
        </button>
      </div>

      {tab === 'leagues' ? (
        <div className="px-4">
          {leagues === null ? (
            <ListSkeleton count={4} />
          ) : leagues.length === 0 ? (
            <EmptyState title="No leagues yet" description="Start a multiplayer challenge to see live standings here!" />
          ) : (
            leagues.map((c) => {
              const sport = getSportDisplay(c);
              const isSeries = c.series_type !== 'single';
              const score = isSeries
                ? `${c.creator_games_won || 0}-${c.opponent_games_won || 0}`
                : (c.status === 'completed' ? (c.winner_name ? `👑 ${c.winner_name}` : 'Draw') : 'Not played');
              return (
                <Link
                  key={c.id}
                  to={`/groups/${c.id}`}
                  className="flex items-center gap-3 bg-card rounded-2xl shadow-sm p-3 mb-2"
                >
                  <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-2xl shrink-0">
                    {sport.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.group_name || `${c.creator_name}'s League`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sport.label} · {(c.opponent_ids?.length || 0) + 1} players · {isSeries ? `Series ${score}` : score}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground capitalize shrink-0">{c.status}</span>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        <div>
          {threads === null ? (
            <ListSkeleton count={4} />
          ) : threads.length === 0 ? (
            <EmptyState title="No chats yet" description="Start a conversation from your friends list!" />
          ) : (
            threads.map((t) => {
              const isGroup = t.type === 'group';
              const idx = t.participant_ids?.findIndex((pid) => pid !== user.id);
              const name = isGroup ? (t.name || 'Group') : (t.participant_names?.[idx] || 'Chat');
              return (
                <Link key={t.id} to={`/messages/${t.id}`} className="flex items-center gap-3 bg-card rounded-2xl shadow-sm p-3 mb-2 mx-4">
                  <Avatar className="w-11 h-11"><AvatarFallback>{name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.last_message}</p>
                  </div>
                  {t.last_message_at && <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</span>}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}