import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CommunityCard from '@/components/communities/CommunityCard';
import CreateCommunityDialog from '@/components/communities/CreateCommunityDialog';
import EmptyState from '@/components/shared/EmptyState';

export default function Communities() {
  const [communities, setCommunities] = useState(null);

  useEffect(() => {
    base44.entities.Community.list('-created_date', 50).then(setCommunities);
  }, []);

  if (communities === null) return <div className="text-center text-muted-foreground py-10">Loading communities...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Communities</h1>
        <CreateCommunityDialog onCreated={(c) => setCommunities([c, ...communities])} />
      </div>
      {communities.length === 0 ? (
        <EmptyState title="No communities yet" description="Start one for your local run!" />
      ) : (
        communities.map((c) => <CommunityCard key={c.id} community={c} />)
      )}
    </div>
  );
}