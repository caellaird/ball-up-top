import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/shared/SegmentedControl';
import PostCard from '@/components/feed/PostCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';

const PAGE = 15;

export default function Home({ user: userProp }) {
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const [tab, setTab] = useState('friends');
  const [posts, setPosts] = useState(null);
  const [myReactions, setMyReactions] = useState({});
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const tabRef = useRef(tab);
  const pageRef = useRef(0);
  const friendIdsRef = useRef(null);
  const blockedIdsRef = useRef(new Set());
  const sentinelRef = useRef(null);

  const fetchPage = (skip) => base44.entities.Post.list('-created_date', PAGE, skip);

  const applyFilters = (data) => {
    const visible = data.filter((p) => !blockedIdsRef.current.has(p.created_by_id));
    if (tabRef.current === 'friends') {
      const friendIds = friendIdsRef.current || new Set();
      return visible.filter((p) => friendIds.has(p.created_by_id) || p.tagged_user_ids?.includes(user.id));
    }
    return visible;
  };

  const loadInitial = async () => {
    setPosts(null);
    const isFriends = tabRef.current === 'friends';
    const [data, myLikes, outgoing, incoming, blocked] = await Promise.all([
      fetchPage(0),
      base44.entities.Like.filter({ created_by_id: user.id }),
      isFriends ? base44.entities.Friend.filter({ created_by_id: user.id, status: 'accepted' }) : Promise.resolve([]),
      isFriends ? base44.entities.Friend.filter({ addressee_id: user.id, status: 'accepted' }) : Promise.resolve([]),
      base44.entities.Friend.filter({ created_by_id: user.id, status: 'blocked' }),
    ]);
    blockedIdsRef.current = new Set(blocked.map((b) => b.addressee_id));
    if (isFriends) {
      friendIdsRef.current = new Set([
        ...outgoing.map((f) => f.addressee_id),
        ...incoming.map((f) => f.created_by_id),
        user.id,
      ]);
    } else {
      friendIdsRef.current = null;
    }
    const map = {};
    myLikes.forEach((l) => {
      map[l.post_id] = map[l.post_id] || {};
      map[l.post_id][l.type || 'like'] = true;
    });
    setMyReactions(map);

    const filtered = applyFilters(data);
    setPosts(filtered);
    pageRef.current = 0;
    setHasMore(data.length === PAGE);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      pageRef.current += 1;
      const data = await fetchPage(pageRef.current * PAGE);
      const filtered = applyFilters(data);
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...filtered.filter((p) => !ids.has(p.id))];
      });
      setHasMore(data.length === PAGE);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    tabRef.current = tab;
    loadInitial();
  }, [tab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '500px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [posts, hasMore, loadingMore]);

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
        <EmptyState
          title={tab === 'friends' ? 'No friend posts yet' : 'No posts yet'}
          description={tab === 'friends' ? "When your friends post results or trash talk, it'll show up here." : 'Be the first to share a result or some trash talk.'}
          action={tab === 'friends' ? (
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/friends">Find friends</Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link to="/ball-up">Ball Up</Link>
            </Button>
          )}
        />
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
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="py-4 text-center text-xs text-muted-foreground">Loading more…</div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">You're all caught up</div>
          )}
        </div>
      )}
    </div>
  );
}