import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/shared/SegmentedControl';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import PullToRefresh from '@/components/shared/PullToRefresh';
import MotionCard from '@/components/shared/MotionCard';
import { PERSONALITY } from '@/lib/personality';
import { isPendingChallengeExpired } from '@/lib/challengeExpiry';

// Module-level: preserves the selected tab across component remounts.
let _persistedTab = 'pending';

// Challenges lists the user's challenges organized by status. The active tab
// is the single source of truth: the full list is fetched once (and on
// refresh/return), and each tab's view is derived from it via filtering — so
// switching tabs is instant and can never render another tab's stale content.
export default function Challenges({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(_persistedTab);
  const [challenges, setChallenges] = useState(null);
  const [, setExpiryTick] = useState(0);

  // Token used to ignore stale fetch responses (e.g. a refresh that completes
  // after the user has triggered a newer fetch).
  const reqId = useRef(0);

  useEffect(() => {
    if (searchParams.get('event')) setTab('accepted');
  }, [searchParams]);

  useEffect(() => { _persistedTab = tab; }, [tab]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const myReq = ++reqId.current;
    try {
      const all = await base44.entities.Challenge.list('-created_date', 100);
      if (myReq !== reqId.current) return; // a newer fetch superseded this one
      setChallenges(all.filter((c) => c.created_by_id === user.id || c.opponent_id === user.id || c.opponent_ids?.includes(user.id)));
    } catch (e) {
      if (myReq !== reqId.current) return;
      setChallenges([]);
    }
  }, [user?.id]);

  // Fetch on mount, whenever the user changes (re-mount returns here), and on
  // every tab switch — so each tab always shows live results. Stale responses
  // from rapid switching are discarded via the request token in `load`.
  useEffect(() => { load(); }, [load, tab]);

  // Refresh when the page regains focus so accept/complete/expire actions
  // taken elsewhere are reflected without a manual pull-to-refresh.
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [load]);

  // Re-evaluate pending expiry while the page stays open so a challenge that
  // crosses the 3-day threshold disappears without a manual refresh.
  useEffect(() => {
    const t = setInterval(() => setExpiryTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // The active tab is the single source of truth for what is rendered. The list
  // is derived directly on every render from the live `tab` + loaded
  // `challenges` — no memoization, so it can never hold a previous tab's items.
  let displayItems = [];
  if (challenges && challenges.length > 0) {
    if (tab === 'pending') displayItems = challenges.filter((c) => c.status === 'pending' && !isPendingChallengeExpired(c));
    else if (tab === 'accepted') displayItems = challenges.filter((c) => c.status === 'accepted');
    else if (tab === 'completed') displayItems = challenges.filter((c) => c.status === 'completed');
  }

  const emptyCopy = {
    pending: { title: PERSONALITY.noChallenges.title, description: PERSONALITY.noChallenges.description },
    accepted: { title: 'No active challenges', description: 'Once a challenge is accepted, it shows up here.' },
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
          : <div className="pt-2" key={tab}>
              {displayItems.map((item, i) => (
                <MotionCard key={item.id} index={i}>
                  <ChallengeCard challenge={item} />
                </MotionCard>
              ))}
            </div>
      }
    </PullToRefresh>
  );
}