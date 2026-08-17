import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import SegmentedControl from '@/components/shared/SegmentedControl';
import PostCard from '@/components/feed/PostCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';

export default function Home({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const [tab, setTab] = useState('friends');
  const [posts, setPosts] = useState(null);
  const [myReactions, setMyReactions] = useState({});

  useEffect(() => {
    load();
  }, [tab]);

  const load = async () => {
    const friendPromise = tab === 'friends';
    const [data, myLikes, outgoing, incoming] = await Promise.all([
      base44.entities.Post.list('-created_date', 30),
      base44.entities.Like.filter({ created_by_id: user.id }),
      friendPromise ? base44.entities.Friend.filter({ created_by_id: user.id, status: 'accepted' }) : Promise.resolve([]),
      friendPromise ? base44.entities.Friend.filter({ addressee_id: user.id, status: 'accepted' }) : Promise.resolve([]),
    ]);
    if (friendPromise) {
      const friendIds = new Set([
        ...outgoing.map((f) => f.addressee_id),
        ...incoming.map((f) => f.created_by_id),
        user.id,
      ]);
      setPosts(data.filter((p) => friendIds.has(p.created_by_id) || p.tagged_user_ids?.includes(user.id)));
    } else {
      setPosts(data);
    }
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
        <ListSkeleton count={4} />
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
              currentUserName={user.full_name}
              onDeleted={(id) => setPosts(posts.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}