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

// Module-level: preserves the selected tab across component remounts.
let _persistedTab = 'pending';

// Challenges lists the user's private challenges organized by status.
// Real-time subscriptions keep the list fresh without a manual refresh.
export default function Challenges({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(_persistedTab);
  const [challenges, setChallenges] = useState(null);

  useEffect(() => {
    if (searchParams.get('event')) setTab('accepted');
  }, [searchParams]);

  useEffect(() => { _persistedTab = tab; }, [tab]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const all = await base44.entities.Challenge.list('-created_date', 100);
      setChallenges(all.filter((c) => c.created_by_id === user.id || c.opponent_id === user.id || c.opponent_ids?.includes(user.id)));
    } catch (e) {
      setChallenges([]);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  let displayItems = [];
  if (challenges && challenges.length > 0) {
    if (tab === 'pending') {
      displayItems = challenges.filter((c) => c.status === 'pending');
    } else if (tab === 'accepted') {
      displayItems = challenges.filter((c) => c.status === 'accepted');
    } else if (tab === 'completed') {
      displayItems = challenges.filter((c) => c.status === 'completed');
    }
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
          onChange={(v) => { setTab(v); load(); }}
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