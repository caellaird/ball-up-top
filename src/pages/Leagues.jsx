import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import LeagueCard from '@/components/leagues/LeagueCard';

export default function Leagues() {
  const { user } = useOutletContext();
  const [leagues, setLeagues] = useState(null);
  const [nextSessions, setNextSessions] = useState({});

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.League.list('-created_date', 50);
      const mine = all.filter((l) => (l.members || []).some((m) => m.user_id === user.id));
      setLeagues(mine);

      if (mine.length === 0) return;
      const res = await base44.entities.LeagueSession.filter(
        { league_id: { $in: mine.map((l) => l.id) } },
        { sort: 'start_time', limit: 100 }
      );
      const now = Date.now();
      const next = {};
      res.items.forEach((s) => {
        const t = new Date(s.start_time).getTime();
        if (t < now) return;
        if (!next[s.league_id] || t < new Date(next[s.league_id].start_time).getTime()) {
          next[s.league_id] = s;
        }
      });
      setNextSessions(next);
    };
    load();
  }, [user.id]);

  return (
    <div className="pb-6">
      <Header title="Leagues" backFallback="/ball-up" />

      <div className="px-4 pt-4">
        <Link to="/leagues/new" className="flex items-center justify-center gap-2 w-full h-12 rounded-full brand-gradient text-white font-bold text-sm arena-shadow active:scale-[0.98] transition">
          <Plus className="w-4 h-4" /> Create a League
        </Link>
      </div>

      <div className="px-4 mt-5 space-y-3">
        {leagues === null ? (
          <ListSkeleton count={3} />
        ) : leagues.length === 0 ? (
          <EmptyState
            title="No leagues yet"
            description="Start a league, add your players and set the times you play. Everyone can say if they're going."
          />
        ) : (
          leagues.map((l) => <LeagueCard key={l.id} league={l} nextSession={nextSessions[l.id]} />)
        )}
      </div>
    </div>
  );
}