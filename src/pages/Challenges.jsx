import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/shared/SegmentedControl';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import PublicEventChallengeCard from '@/components/challenges/PublicEventChallengeCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';

// Challenges lists the user's private challenges AND the public events they've
// joined/created. Accepted public events appear under the "Accepted" tab
// alongside accepted private challenges, sorted soonest-first with live status
// badges. Real-time subscriptions keep both lists fresh without a manual refresh.
export default function Challenges({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('pending');
  const [challenges, setChallenges] = useState(null);
  const [events, setEvents] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (searchParams.get('event')) setTab('accepted'); // deep link opens Accepted
  }, [searchParams]);

  const load = async () => {
    const all = await base44.entities.Challenge.list('-created_date', 100);
    setChallenges(all.filter((c) => c.created_by_id === user.id || c.opponent_id === user.id || c.opponent_ids?.includes(user.id)));
    await loadEvents();
  };

  const loadEvents = async () => {
    try {
      const myPart = await base44.entities.EventParticipant.filter({ user_id: user.id, status: 'accepted' });
      const ids = [...new Set(myPart.map((p) => p.event_id).filter(Boolean))];
      const fetched = await Promise.all(ids.map((id) => base44.entities.PublicEvent.get(id).catch(() => null)));
      setEvents(fetched.filter(Boolean));
    } catch (e) {
      setEvents([]);
    }
  };

  useEffect(() => { load(); }, []);

  // Keep the "time remaining" labels and live/upcoming transitions fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Real-time: new accepted events / participant changes / event status changes.
  useEffect(() => {
    const u1 = base44.entities.EventParticipant.subscribe(() => { loadEvents(); });
    const u2 = base44.entities.PublicEvent.subscribe((ev) => {
      const d = ev?.data;
      if (!d) return;
      setEvents((prev) => (prev || []).map((e) => (e.id === d.id ? { ...e, ...d } : e)));
    });
    return () => { u1?.(); u2?.(); };
  }, []);

  const grouped = {
    pending: challenges?.filter((c) => c.status === 'pending') || [],
    accepted: [],
    completed: challenges?.filter((c) => c.status === 'completed') || [],
  };

  // Merge accepted private challenges with accepted/active public events.
  if (challenges && events) {
    const acceptedChallenges = challenges.filter((c) => c.status === 'accepted');
    const activeEvents = events.filter((e) => e.status === 'active' || e.status === 'ended');
    // Sort: active (upcoming/soon/live) first by soonest start, then ended.
    const isActive = (e) => e.status === 'active' && new Date(e.start_datetime).getTime() > now;
    const sortedEvents = [...activeEvents].sort((a, b) => {
      const aActive = isActive(a), bActive = isActive(b);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
    });
    grouped.accepted = [...sortedEvents, ...acceptedChallenges];
  }

  const emptyCopy = {
    pending: { title: 'No pending challenges', description: 'Tap Ball Up to challenge a friend to a game.' },
    accepted: { title: 'No active challenges', description: 'Once a challenge is accepted or you join a public event, it shows up here.' },
    completed: { title: 'No completed challenges yet', description: 'Finish a challenge and log the result to see it here.' }
  };

  return (
    <div>
      <Header title="Challenges" />
      <div className="px-4 pt-4 pb-2 sticky top-14 z-20 bg-background">
        <SegmentedControl
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'completed', label: 'Completed' }
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {challenges === null || events === null
        ? <ListSkeleton count={4} />
        : grouped[tab].length === 0
          ? <EmptyState
              title={emptyCopy[tab].title}
              description={emptyCopy[tab].description}
              action={tab !== 'completed'
                ? <Button asChild className="rounded-full"><Link to="/ball-up">Ball Up Top</Link></Button>
                : undefined}
            />
          : <div className="pt-2">
              {grouped[tab].map((item) =>
                item.competition_type
                  ? <PublicEventChallengeCard key={`ev-${item.id}`} event={item} now={now} />
                  : <ChallengeCard key={item.id} challenge={item} />
              )}
            </div>
      }
    </div>
  );
}