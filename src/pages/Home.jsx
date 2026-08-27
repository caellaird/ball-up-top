import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/shared/SegmentedControl';
import PostCard from '@/components/feed/PostCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import PullToRefresh from '@/components/shared/PullToRefresh';
import ExploreMap from '@/components/explore/ExploreMap';
import PublicEventCard from '@/components/explore/PublicEventCard';

const PAGE = 15;
const WINDOW_MS = 12 * 3600 * 1000;

export default function Home({ user: userProp }) {
  const outletCtx = useOutletContext();
  const navigate = useNavigate();
  const user = userProp || outletCtx?.user;
  const [tab, setTab] = useState('friends');
  const [posts, setPosts] = useState(null);
  const [myReactions, setMyReactions] = useState({});
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sharedEvents, setSharedEvents] = useState([]);
  const [friendRecords, setFriendRecords] = useState({});

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

  const loadInitial = async (silent = false) => {
    if (tabRef.current === 'explore') { if (!silent) setPosts(null); return; }
    if (!silent) setPosts(null);
    const isFriends = tabRef.current === 'friends';
    // Single combined friend query replaces the 3 per-status fetches and gives
    // us a complete relation map for every feed author — one request for the
    // whole feed instead of one per post card (which tripped the rate limit).
    const [data, myLikes, myRelations] = await Promise.all([
      fetchPage(0),
      base44.entities.Like.filter({ created_by_id: user.id }),
      base44.entities.Friend.filter({ $or: [{ created_by_id: user.id }, { addressee_id: user.id }] }),
    ]);
    const friendRecordByUserId = {};
    const acceptedIds = new Set([user.id]);
    const blockedSet = new Set();
    for (const f of myRelations) {
      const otherId = f.created_by_id === user.id ? f.addressee_id : f.created_by_id;
      const prev = friendRecordByUserId[otherId];
      if (!prev || (prev.status === 'cancelled' && f.status !== 'cancelled')) {
        friendRecordByUserId[otherId] = f;
      }
      if (f.status === 'accepted') acceptedIds.add(otherId);
      if (f.status === 'blocked' && f.created_by_id === user.id) blockedSet.add(otherId);
    }
    blockedIdsRef.current = blockedSet;
    setFriendRecords(friendRecordByUserId);
    if (isFriends) {
      friendIdsRef.current = acceptedIds;
      const now = Date.now();
      try {
        const evs = await base44.entities.PublicEvent.filter({ status: 'active', share_to_friends: true });
        setSharedEvents(evs.filter((e) => acceptedIds.has(e.created_by_id) && new Date(e.start_datetime).getTime() > now && new Date(e.start_datetime).getTime() <= now + WINDOW_MS));
      } catch (e) { setSharedEvents([]); }
    } else {
      friendIdsRef.current = null;
      setSharedEvents([]);
    }
    const map = {};
    myLikes.forEach((l) => { map[l.post_id] = map[l.post_id] || {}; map[l.post_id][l.type || 'like'] = true; });
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

  useEffect(() => { tabRef.current = tab; loadInitial(); }, [tab]);

  useEffect(() => {
    if (tab !== 'friends') return;
    const unsub = base44.entities.PublicEvent.subscribe((event) => {
      const d = event?.data;
      if (!d) return;
      if (d.status !== 'active' || !d.share_to_friends) {
        setSharedEvents((prev) => prev.filter((e) => e.id !== d.id));
        return;
      }
      setSharedEvents((prev) => {
        if (!friendIdsRef.current?.has(d.created_by_id)) return prev;
        if (prev.some((e) => e.id === d.id)) return prev.map((e) => (e.id === d.id ? { ...e, ...d } : e));
        return [d, ...prev];
      });
    });
    return unsub;
  }, [tab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '500px' });
    io.observe(el);
    return () => io.disconnect();
  }, [posts, hasMore, loadingMore]);

  const countField = { like: 'like_count', fire: 'fire_count', trash_talk: 'trash_count', trophy: 'trophy_count' };
  const onReact = async (post, type) => {
    const already = myReactions[post.id]?.[type];
    const newMap = { ...myReactions, [post.id]: { ...myReactions[post.id], [type]: !already } };
    if (already) {
      const existing = await base44.entities.Like.filter({ post_id: post.id, created_by_id: user.id, type });
      if (existing[0]) await base44.entities.Like.delete(existing[0].id);
      await base44.entities.Post.update(post.id, { [countField[type]]: Math.max((post[countField[type]] || 1) - 1, 0) });
    } else {
      await base44.entities.Like.create({ post_id: post.id, type });
      await base44.entities.Post.update(post.id, { [countField[type]]: (post[countField[type]] || 0) + 1 });
    }
    setMyReactions(newMap);
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, [countField[type]]: p[countField[type]] + (already ? -1 : 1) } : p)));
  };

  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="px-4 pt-2 pb-2">
        <SegmentedControl options={[{ value: 'friends', label: 'Friends' }, { value: 'explore', label: 'Explore' }]} value={tab} onChange={setTab} />
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'explore' ? (
          <ExploreMap user={user} onOpenChat={(chatId) => navigate(`/messages/${chatId}`)} />
        ) : (
          <PullToRefresh className="h-full overflow-y-auto overscroll-contain" onRefresh={() => loadInitial(true)}>
            {sharedEvents.length > 0 && (
              <div className="pt-2">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Shared Events</p>
                {sharedEvents.map((e) => <PublicEventCard key={e.id} event={e} user={user} />)}
              </div>
            )}
            {posts === null ? (
              <ListSkeleton count={4} />
            ) : posts.length === 0 && sharedEvents.length === 0 ? (
              <EmptyState
                title="No friend posts yet"
                description="When your friends post results or trash talk, it'll show up here."
                action={<Button asChild variant="secondary" className="rounded-full"><Link to="/friends">Find friends</Link></Button>}
              />
            ) : (
              <div className="pt-2">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    reactions={{ liked: !!myReactions[post.id]?.like, fired: !!myReactions[post.id]?.fire, trophied: !!myReactions[post.id]?.trophy, trashed: !!myReactions[post.id]?.trash_talk }}
                    onReact={onReact}
                    userId={user.id}
                    currentUserName={user.full_name}
                    friendRecordByUserId={friendRecords}
                    onDeleted={(id) => setPosts(posts.filter((p) => p.id !== id))}
                  />
                ))}
                <div ref={sentinelRef} className="h-1" />
                {loadingMore && <div className="py-4 text-center text-xs text-muted-foreground">Loading more…</div>}
                {!hasMore && posts.length > 0 && <div className="py-6 text-center text-xs text-muted-foreground">You're all caught up</div>}
              </div>
            )}
          </PullToRefresh>
        )}
      </div>
    </div>
  );
}