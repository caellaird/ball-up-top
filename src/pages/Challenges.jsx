import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import CreateChallengeDialog from '@/components/challenges/CreateChallengeDialog';
import EmptyState from '@/components/shared/EmptyState';

export default function Challenges() {
  const [challenges, setChallenges] = useState(null);

  useEffect(() => {
    base44.entities.Challenge.list('-created_date', 50).then(setChallenges);
  }, []);

  if (challenges === null) return <div className="text-center text-muted-foreground py-10">Loading challenges...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Challenges</h1>
        <CreateChallengeDialog onCreated={(c) => setChallenges([c, ...challenges])} />
      </div>
      {challenges.length === 0 ? (
        <EmptyState title="No challenges yet" description="Create one or join a public challenge!" />
      ) : (
        challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)
      )}
    </div>
  );
}