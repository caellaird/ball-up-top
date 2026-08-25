import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/shared/SegmentedControl';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';

export default function Challenges({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const [tab, setTab] = useState('pending');
  const [challenges, setChallenges] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const all = await base44.entities.Challenge.list('-created_date', 100);
    setChallenges(all.filter((c) => c.created_by_id === user.id || c.opponent_id === user.id || c.opponent_ids?.includes(user.id)));
  };

  const grouped = {
    pending: challenges?.filter((c) => c.status === 'pending') || [],
    accepted: challenges?.filter((c) => c.status === 'accepted') || [],
    completed: challenges?.filter((c) => c.status === 'completed') || []
  };

  const emptyCopy = {
    pending: { title: 'No pending challenges', description: 'Tap Ball Up to challenge a friend to a game.' },
    accepted: { title: 'No active challenges', description: 'Once a challenge is accepted, it shows up here.' },
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
          { value: 'completed', label: 'Completed' }]
          }
          value={tab}
          onChange={setTab} />
        
      </div>
      {challenges === null ?
      <ListSkeleton count={4} /> :
      grouped[tab].length === 0 ?
      <EmptyState
        title={emptyCopy[tab].title}
        description={emptyCopy[tab].description}
        action={tab !== 'completed' ?
        <Button asChild className="rounded-full">
              <Link to="/ball-up">Ball Up Top</Link>
            </Button> :
        undefined} /> :


      <div className="pt-2">
          {grouped[tab].map((c) => <ChallengeCard key={c.id} challenge={c} />)}
        </div>
      }
    </div>);

}