import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import SegmentedControl from '@/components/shared/SegmentedControl';
import PostCard from '@/components/feed/PostCard';
import EmptyState from '@/components/shared/EmptyState';

export default function Home() {
  const { user } = useOutletContext();
  const [tab, setTab] = useState('friends');
  const [posts, setPosts] = useState(null);
  const [myReactions, setMyReactions] = useState({});

  useEffect(() => {
    load();
  }, [tab]);

  const load = async () => {
    const data = await base44.entities.Post.list('-created_date', 30);
    if (tab === 'friends') {
      const accepted = await base44.entities.Friend.filter({ status: 'accepted' });
      const mine = accepted.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
      const friendIds = new Set(mine.map((f) => (f.created_by_id === user.id ? f.addressee_id : f.created_by_id)));
      friendIds.add(user.id);
      setPosts(data.filter((p) => friendIds.has(p.created_by_id)));
    } else {
      setPosts(data);
    }
    const myLikes = await base44.entities.Like.filter({ created_by_id: user.id });
    const map = {};
    myLikes.forEach((l) => {
      map[l.post_id] = map[l.post_id] || {};
      map[l.post_id][l.type || 'like'] = true;
    });
    setMyReactions(map);
  };

  const countField = { like: 'like_count', fire: 'fire_count', trash_talk: 'trash_count' };
  const flagField = { like: 'liked', fire: 'fired', trash_talk: 'trashed' };

  const onReact = async (post, type) => {
    const field = countField[type];
    const flag = flagField[type];
    const already = myReactions[post.id]?.[type];
    const newMap = { ...myReactions, [post.id]: { ...myReactions[post.id], [type]: !already } };

    if (already) {
      const existing = await base44.entities.Like.filter({ post_id: post.id, created_by_id: user.id, type });
      if (existing[0]) await base44.entities.Like.delete(existing[0].id);
      await base44.entities.Post.update(post.id, { [field]: Math.max((post[field] || 1) - 1, 0) });
    } else {
      await base44.entities.Like.create({ post_id: post.id, type });
      await base44.entities.Post.update(post.id, { [field]: (post[field] || 0) + 1 });
    }
    setMyReactions(newMap);
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, [field]: p[field] + (already ? -1 : 1) } : p)));
  };

  return (
    <div>
      <Header />
      <div className="px-4 pt-4 pb-2 sticky top-14 z-20 bg-background">
        <SegmentedControl
          options={[{ value: 'friends', label: 'Friends' }, { value: 'explore', label: 'Explore' }]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {posts === null ? (
        <div className="text-center text-muted-foreground py-10">Loading feed...</div>
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Complete a challenge to share your first result!" />
      ) : (
        <div className="pt-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              reactions={{
                liked: !!myReactions[post.id]?.like,
                fired: !!myReactions[post.id]?.fire,
                trashed: !!myReactions[post.id]?.trash_talk,
              }}
              onReact={onReact}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}