import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
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

// Challenges lists the user's challenges organized by status. This page stays
// permanently mounted in TabContainer, so `activeTab` (plain component state)
// persists across opening a challenge and coming back. It is the ONLY value
// controlling the selected tab; cards are derived from it + the fetched list
// on every render, so the tab and the cards can never disagree.
export default function Challenges({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const { pathname } = useLocation();
  const [activeTab, setActiveTab] = useState('pending');
  const [challenges, setChallenges] = useState(null);
  const [, setExpiryTick] = useState(0);

  // Token used to ignore stale fetch responses (e.g. a refresh that completes
  // after the user has triggered a newer fetch).
  const reqId = useRef(0);

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

  // Fetch on mount, on every tab switch, and whenever you return to this page
  // (e.g. back from a challenge you just accepted/completed). Stale responses
  // from rapid switching are discarded via the request token in `load`.
  const isVisible = pathname === '/challenges';
  useEffect(() => { if (isVisible) load(); }, [load, activeTab, isVisible]);

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

  // Derived on every render from `activeTab` + the latest `challenges`.
  const displayItems = (challenges || []).filter((c) => {
    if (activeTab === 'pending') return c.status === 'pending' && !isPendingChallengeExpired(c);
    return c.status === activeTab;
  });

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
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>
      {challenges === null
        ? <ListSkeleton count={4} />
        : displayItems.length === 0
          ? <EmptyState
              title={emptyCopy[activeTab].title}
              description={emptyCopy[activeTab].description}
              action={activeTab !== 'completed'
                ? <Button asChild className="rounded-full"><Link to="/ball-up">Ball Up Top</Link></Button>
                : undefined}
            />
          : <div className="pt-2" key={activeTab}>
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