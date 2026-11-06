import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Plus, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import SessionCard from '@/components/leagues/SessionCard';
import AddSessionSheet from '@/components/leagues/AddSessionSheet';
import RecapPostSheet from '@/components/leagues/RecapPostSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSportDisplay } from '@/lib/constants';
import { getOrCreateProfile } from '@/lib/ensureProfile';

export default function LeagueDetail() {
  const { user } = useOutletContext();
  const { leagueId } = useParams();

  const [league, setLeague] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [recapSession, setRecapSession] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const l = await base44.entities.League.get(leagueId);
        setLeague(l);
        const s = await base44.entities.LeagueSession.filter({ league_id: leagueId }, { sort: 'start_time', limit: 100 });
        setSessions(s.items);
        const r = await base44.entities.LeagueRsvp.filter({ league_id: leagueId }, { limit: 200 });
        setRsvps(r.items);
        setProfile(await getOrCreateProfile(user));
      } catch {
        setNotFound(true);
      }
    };
    load();
  }, [leagueId, user.id]);

  useEffect(() => {
    if (!notFound) return;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [notFound]);

  const myStatusFor = (sessionId) => {
    const mine = rsvps.find((r) => r.session_id === sessionId && r.created_by_id === user.id);
    return mine?.status;
  };

  const handleRsvp = async (session, status) => {
    setSavingId(session.id);
    try {
      const existing = rsvps.find((r) => r.session_id === session.id && r.created_by_id === user.id);
      if (existing?.status === status) {
        await base44.entities.LeagueRsvp.delete(existing.id);
        setRsvps((prev) => prev.filter((r) => r.id !== existing.id));
      } else if (existing) {
        const updated = await base44.entities.LeagueRsvp.update(existing.id, { status });
        setRsvps((prev) => prev.map((r) => (r.id === existing.id ? updated : r)));
      } else {
        const created = await base44.entities.LeagueRsvp.create({
          league_id: league.id,
          session_id: session.id,
          status,
          user_name: user.full_name,
          user_avatar: profile?.avatar_url,
        });
        setRsvps((prev) => [...prev, created]);
      }
    } finally {
      setSavingId(null);
    }
  };

  const addSession = async ({ start_time, note }) => {
    const created = await base44.entities.LeagueSession.create({
      league_id: league.id,
      start_time,
      note: note || undefined,
      location_name: league.location_name,
    });
    setSessions((prev) => [...prev, created].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
  };

  if (notFound) {
    return (
      <div>
        <Header title="League" backFallback="/leagues" />
        <EmptyState title="League not found" description="It may have been deleted." />
      </div>
    );
  }

  if (!league) {
    return (
      <div>
        <Header title="League" backFallback="/leagues" />
        <div className="px-4 pt-4"><ListSkeleton count={3} /></div>
      </div>
    );
  }

  const sport = getSportDisplay(league);
  const members = league.members || [];
  const now = Date.now();
  const upcoming = sessions.filter((s) => new Date(s.start_time).getTime() >= now);
  const past = sessions.filter((s) => new Date(s.start_time).getTime() < now).reverse();

  return (
    <div className="pb-8">
      <Header title={league.name} backFallback="/leagues" />

      <div className="px-4 pt-4">
        <div className="bg-card rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl shrink-0">
              {sport.emoji}
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-extrabold truncate">{league.name}</h1>
              <p className="text-xs text-muted-foreground">
                {sport.label} · {members.length} {members.length === 1 ? 'player' : 'players'}
              </p>
            </div>
          </div>

          {league.location_name && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
              <MapPin className="w-3.5 h-3.5" /> {league.location_name}
            </p>
          )}
          {league.description && (
            <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{league.description}</p>
          )}

          {members.length > 0 && (
            <div className="flex -space-x-2 mt-4">
              {members.slice(0, 8).map((m) => (
                <Avatar key={m.user_id} className="w-8 h-8 border-2 border-card">
                  <AvatarImage src={m.avatar_url} />
                  <AvatarFallback className="text-[10px]">{m.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              ))}
              {members.length > 8 && (
                <span className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold">
                  +{members.length - 8}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upcoming times</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Plus className="w-4 h-4" /> Add time
          </button>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card rounded-2xl p-4">
            No times yet. Add one so players can say if they're going.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                rsvps={rsvps}
                myStatus={myStatusFor(s.id)}
                saving={savingId === s.id}
                onRsvp={handleRsvp}
                isPast={false}
              />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="px-4 mt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Past times</p>
          <div className="space-y-3">
            {past.slice(0, 5).map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                rsvps={rsvps}
                myStatus={myStatusFor(s.id)}
                saving={false}
                onRsvp={() => {}}
                isPast
                onRecap={setRecapSession}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Players</p>
        <div className="bg-card rounded-2xl divide-y divide-border">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={m.avatar_url} />
                <AvatarFallback className="text-xs">{m.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold flex-1 truncate">{m.name}</p>
              {m.user_id === league.created_by_id && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Organizer</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <AddSessionSheet open={showAdd} onOpenChange={setShowAdd} onCreate={addSession} />

      {recapSession && (
        <RecapPostSheet
          open
          onOpenChange={() => setRecapSession(null)}
          league={league}
          session={recapSession}
          attendees={rsvps.filter((r) => r.session_id === recapSession.id && r.status === 'going')}
        />
      )}
    </div>
  );
}