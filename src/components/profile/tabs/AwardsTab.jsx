import React from 'react';
import EmptyState from '@/components/shared/EmptyState';

export default function AwardsTab({ awards }) {
  if (!awards || awards.length === 0) {
    return (
      <div className="px-4 pt-6">
        <EmptyState title="No awards yet" description="Awards from completed challenges will show up here." />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <div className="flex flex-wrap gap-2">
        {awards.map((a) => (
          <span key={a.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 text-accent">{a.type}</span>
        ))}
      </div>
    </div>
  );
}