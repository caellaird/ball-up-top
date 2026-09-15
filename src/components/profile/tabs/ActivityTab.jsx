import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PostCard from '@/components/feed/PostCard';
import RivalryAnnouncementCard from '@/components/feed/RivalryAnnouncementCard';
import CompletedChallenges from '@/components/profile/CompletedChallenges';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActivityTab({ ownerId, ownerName, viewerId }) {
  const [posts, setPosts] = useState(null);

  useEffect(() => { load(); }, [ownerId]);

  const load = async () => {
    try {
      // Sequential fetches to avoid rate-limit bursts (parallel Promise.all caused 429s).
      const mine = await base44.entities.Post.filter({ created_by_id: ownerId }, '-created_date', 20);
      const tagged = await base44.entities.Post.list('-created_date', 100);
      const taggedPosts = tagged.filter((p) => p.created_by_id !== ownerId && p.tagged_user_ids?.includes(ownerId));
      const combined = [...mine, ...taggedPosts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setPosts(combined);
    } catch {
      setPosts([]);
    }
  };

  const onReact = async (post, type) => {
    const field = { like: 'like_count', fire: 'fire_count', trash_talk: 'trash_count' }[type];
    await base44.entities.Post.update(post.id, { [field]: (post[field] || 0) + 1 });
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, [field]: (p[field] || 0) + 1 } : p)));
  };

  return (
    <div className="pt-4">
      <div className="px-4">
        <CompletedChallenges userId={ownerId} userName={ownerName} />
      </div>
      <h3 className="font-heading font-bold mt-6 mb-3 px-4">Posts</h3>
      {posts === null ? (
        <div className="px-4 space-y-3">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-4">
          <EmptyState title="No posts yet" description="Share a result to see it here!" />
        </div>
      ) : (
        posts.map((post) => (
          post.post_type === 'rivalry_announcement' ? (
            <RivalryAnnouncementCard
              key={post.id}
              post={post}
              reactions={{}}
              onReact={onReact}
              userId={viewerId || ownerId}
              onDeleted={(id) => setPosts(posts.filter((p) => p.id !== id))}
            />
          ) : (
            <PostCard
              key={post.id}
              post={post}
              reactions={{}}
              onReact={onReact}
              userId={viewerId || ownerId}
              onDeleted={(id) => setPosts(posts.filter((p) => p.id !== id))}
            />
          )
        ))
      )}
    </div>
  );
}