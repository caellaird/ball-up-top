import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import EmptyState from '@/components/shared/EmptyState';

export default function Home() {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await base44.entities.Post.list('-created_date', 30);
    setPosts(data);
    const myLikes = await base44.entities.Like.filter({ created_by_id: user.id });
    setLikedIds(new Set(myLikes.map((l) => l.post_id)));
  };

  const toggleLike = async (post) => {
    const isLiked = likedIds.has(post.id);
    const newLiked = new Set(likedIds);
    if (isLiked) {
      const existing = await base44.entities.Like.filter({ post_id: post.id, created_by_id: user.id });
      if (existing[0]) await base44.entities.Like.delete(existing[0].id);
      await base44.entities.Post.update(post.id, { like_count: Math.max((post.like_count || 1) - 1, 0) });
      newLiked.delete(post.id);
    } else {
      await base44.entities.Like.create({ post_id: post.id });
      await base44.entities.Post.update(post.id, { like_count: (post.like_count || 0) + 1 });
      newLiked.add(post.id);
    }
    setLikedIds(newLiked);
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, like_count: p.like_count + (isLiked ? -1 : 1) } : p)));
  };

  if (posts === null) return <div className="text-center text-muted-foreground py-10">Loading feed...</div>;

  return (
    <div>
      <PostComposer onPosted={(p) => setPosts([p, ...posts])} />
      {posts.length === 0 ? (
        <EmptyState title="Your feed is empty" description="Be the first to post and get the run started!" />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} liked={likedIds.has(post.id)} onToggleLike={toggleLike} />)
      )}
    </div>
  );
}