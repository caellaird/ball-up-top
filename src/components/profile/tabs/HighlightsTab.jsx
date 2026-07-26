import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/shared/EmptyState';
import MediaViewer from '@/components/feed/MediaViewer';
import { Skeleton } from '@/components/ui/skeleton';

export default function HighlightsTab({ ownerId }) {
  const [media, setMedia] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null);

  useEffect(() => { load(); }, [ownerId]);

  const load = async () => {
    const [posts, challenges] = await Promise.all([
      base44.entities.Post.filter({ created_by_id: ownerId }, '-created_date', 30),
      base44.entities.Challenge.filter({ created_by_id: ownerId, status: 'completed' }, '-updated_date', 30),
    ]);
    const urls = [
      ...posts.flatMap((p) => p.media_urls || []),
      ...challenges.flatMap((c) => c.photos || []),
    ];
    setMedia(urls);
  };

  if (media === null) {
    return (
      <div className="px-4 pt-4 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="px-4 pt-6">
        <EmptyState title="No highlights yet" description="Photos from posts and matches will show up here." />
      </div>
    );
  }

  return (
    <div className="pt-4 pb-6">
      <div className="grid grid-cols-3 gap-1 px-1">
        {media.map((url, i) => (
          <button key={i} onClick={() => setViewerIndex(i)} className="aspect-square overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {viewerIndex !== null && (
        <MediaViewer urls={media} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}