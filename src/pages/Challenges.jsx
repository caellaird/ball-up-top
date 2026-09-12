import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/shared/SegmentedControl';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import PublicEventChallengeCard from '@/components/challenges/PublicEventChallengeCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import PullToRefresh from '@/components/shared/PullToRefresh';

// Module-level: preserves the selected tab across component remounts.
// TabContainer keeps this component mounted during tab navigation, but a
// Suspense fallback (lazy route loading) or brief auth re-check can unmount
// and remount MobileShell — resetting useState. This variable survives that.
let _persistedTab = 'pending';

// Challenges lists the user's private challenges AND the public events they've
// joined/created. Accepted public events appear under the "Accepted" tab
// alongside accepted private challenges, sorted soonest-first with live status
// badges. Real-time subscriptions keep both lists fresh without a manual refresh.
export default function Challenges({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(_persistedTab);
  const [challenges, setChallenges] = useState(null);
  // Default to [] so the loading gate only depends on `challenges` — a null
  // events array would keep the skeleton visible forever if loadEvents fails.
  const [events, setEvents] = useState([]);
  const now = useRef(Date.now());

  useEffect(() => {
    if (searchParams.get('event')) setTab('accepted'); // deep link opens Accepted
  }, [searchParams]);

  // Persist tab across remounts — the single source of truth for which
  // status filter is active. displayItems is derived from this + challenges.
  useEffect(() => { _persistedTab = tab; }, [tab]);

  const loadEvents = useCallback(async () => {
    if (!user?.id) { setEvents([]); return; }
    try {
      const myPart = await base44.entities.EventParticipant.filter({ user_id: user.id, status: 'accepted' });
      const ids = [...new Set(myPart.map((p) => p.event_id).filter(Boolean))];
      if (ids.length === 0) { setEvents([]); return; }
      const fetched = await base44.entities.PublicEvent.filter({ id: { $in: ids } });
      setEvents(Array.isArray(fetched) ? fetched : []);
    } catch (e) {
      setEvents([]);
    }
  }, [user?.id]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const all = await base44.entities.Challenge.list('-created_date', 100);
      setChallenges(all.filter((c) => c.created_by_id === user.id || c.opponent_id === user.id || c.opponent_ids?.includes(user.id)));
    } catch (e) {
      setChallenges([]);
    }
    await loadEvents();
  }, [user?.id, loadEvents]);

  useEffect(() => { load(); }, [load]);

  // Real-time: new accepted events / participant changes / event status changes.
  useEffect(() => {
    const u1 = base44.entities.EventParticipant.subscribe(() => { loadEvents(); });
    const u2 = base44.entities.PublicEvent.subscribe((ev) => {
      const d = ev?.data;
      if (!d) return;
      setEvents((prev) => (Array.isArray(prev) ? prev : []).map((e) => (e.id === d.id ? { ...e, ...d } : e)));
    });
    return () => { u1?.(); u2?.(); };
  }, [loadEvents]);

  // Compute the display list directly from the current `tab` on every render.
  // No useMemo — the list is derived fresh from `challenges`, `events`, and
  // `tab` each time the component renders, so switching tabs always produces
  // the correct filtered list.
  let displayItems = [];
  if (challenges && challenges.length > 0) {
    if (tab === 'pending') {
      displayItems = challenges.filter((c) => c.status === 'pending');
    } else if (tab === 'accepted') {
      const activeEvents = events
        .filter((e) => e.status === 'active')
        .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
      const acceptedChallenges = challenges.filter((c) => c.status === 'accepted');
      displayItems = [...activeEvents, ...acceptedChallenges];
    } else if (tab === 'completed') {
      const finishedEvents = events
        .filter((e) => e.status === 'ended' || e.status === 'cancelled')
        .sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
      const completedChallenges = challenges.filter((c) => c.status === 'completed');
      displayItems = [...finishedEvents, ...completedChallenges];
    }
  }

  const emptyCopy = {
    pending: { title: 'No pending challenges', description: 'Tap Ball Up to challenge a friend to a game.' },
    accepted: { title: 'No active challenges', description: 'Once a challenge is accepted or you join a public event, it shows up here.' },
    completed: { title: 'No completed challenges yet', description: 'Finish a challenge and log the result to see it here.' }
  };

  return (
    <PullToRefresh className="h-full overflow-y-auto overscroll-contain" onRefresh={load}>
      <Header title="Challenges" />
      <div className="px-4 pt-4 pb-2 sticky z-20 bg-background" style={{ top: 'calc(3.5rem + env(safe-area-inset-top))' }}>
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
      {challenges === null
        ? <ListSkeleton count={4} />
        : displayItems.length === 0
          ? <EmptyState
              title={emptyCopy[tab].title}
              description={emptyCopy[tab].description}
              action={tab !== 'completed'
                ? <Button asChild className="rounded-full"><Link to="/ball-up">Ball Up Top</Link></Button>
                : undefined}
            />
          : <div className="pt-2">
              {displayItems.map((item) =>
                item.competition_type
                  ? <PublicEventChallengeCard key={`ev-${item.id}`} event={item} now={now.current} />
                  : <ChallengeCard key={item.id} challenge={item} />
              )}
            </div>
      }
    </PullToRefresh>
  );
}