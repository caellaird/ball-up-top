import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/shared/SegmentedControl';
import PostCard from '@/components/feed/PostCard';
import { useReactions } from '@/hooks/useReactions';
import RivalryAnnouncementCard from '@/components/feed/RivalryAnnouncementCard';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import PullToRefresh from '@/components/shared/PullToRefresh';
import CityRankings from '@/components/explore/CityRankings';
import FeedPersonalHeader from '@/components/feed/FeedPersonalHeader';
import MotionCard from '@/components/shared/MotionCard';
import { PERSONALITY } from '@/lib/personality';

const PAGE = 15;
// The friends feed filters after fetching, so a first page can be entirely
// people you don't follow yet. Keep paging until there's something to show.
const MAX_INITIAL_SCAN = 6;
const MAX_EMPTY_BATCHES = 3;

export default function Home({ user: userProp }) {
  const outletCtx = useOutletContext();
  const navigate = useNavigate();
  const user = userProp || outletCtx?.user;
  const [tab, setTab] = useState('friends');
  const [posts, setPosts] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [friendRecords, setFriendRecords] = useState({});

  const tabRef = useRef(tab);
  const requestRef = useRef(0);
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
    const token = ++requestRef.current;
    const isFriends = tabRef.current === 'friends';
    if (!silent) { setPosts(null); setLoadError(false); }
    try {
      // Sequential (not Promise.all) to avoid bursting API calls and tripping the rate limit.
      const myRelations = await base44.entities.Friend.filter({ $or: [{ created_by_id: user.id }, { addressee_id: user.id }] });
      if (token !== requestRef.current) return;
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
      friendIdsRef.current = isFriends ? acceptedIds : null;
      setFriendRecords(friendRecordByUserId);

      let page = 0;
      let batch = await fetchPage(0);
      if (token !== requestRef.current) return;
      let visible = applyFilters(batch);

      // Friends-only view: the newest posts are often from people you don't
      // follow yet, so keep paging until there's something to show or the
      // feed runs out (bounded, sequential).
      while (isFriends && visible.length === 0 && batch.length === PAGE && page < MAX_INITIAL_SCAN) {
        page += 1;
        batch = await fetchPage(page * PAGE);
        if (token !== requestRef.current) return;
        visible = applyFilters(batch);
      }

      pageRef.current = page;
      setPosts(visible);
      setHasMore(batch.length === PAGE);
      setLoadError(false);
    } catch {
      // Never leave the feed stuck on the skeleton: surface a retry instead.
      if (token === requestRef.current && !silent) setLoadError(true);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts === null) return;
    setLoadingMore(true);
    const startPage = pageRef.current;
    try {
      let page = startPage;
      let batch = [];
      let visible = [];
      // Skip over batches that contain nobody you follow, so infinite scroll
      // keeps making progress instead of stalling on filtered-out pages.
      for (let i = 0; i < MAX_EMPTY_BATCHES; i += 1) {
        page += 1;
        batch = await fetchPage(page * PAGE);
        visible = applyFilters(batch);
        if (visible.length > 0 || batch.length < PAGE) break;
      }
      pageRef.current = page;
      setPosts((prev) => {
        const list = prev || [];
        const ids = new Set(list.map((p) => p.id));
        return [...list, ...visible.filter((p) => !ids.has(p.id))];
      });
      setHasMore(batch.length === PAGE);
    } catch {
      // Roll back so a retry refetches the same page instead of skipping it.
      pageRef.current = startPage;
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { tabRef.current = tab; loadInitial(); }, [tab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '500px' });
    io.observe(el);
    return () => io.disconnect();
  }, [posts, hasMore, loadingMore]);

  const postIds = (posts || []).map((p) => p.id);
  const { countsByPost, myEmojiByPost, react } = useReactions(postIds, user.id);

  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="px-4 pt-2 pb-2">
        <SegmentedControl options={[{ value: 'friends', label: 'Friends' }, { value: 'explore', label: 'Explore' }]} value={tab} onChange={setTab} />
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'explore' ? (
          <CityRankings user={user} />
        ) : (
          <PullToRefresh className="h-full overflow-y-auto overscroll-contain" onRefresh={() => loadInitial(true)}>
            <FeedPersonalHeader user={user} />
            {posts === null ? (
              loadError ? (
                <div className="px-6 py-16 text-center">
                  <p className="font-heading font-bold mb-1">Couldn't load your feed</p>
                  <p className="text-sm text-muted-foreground mb-4">Check your connection and try again.</p>
                  <Button variant="secondary" className="rounded-full" onClick={() => loadInitial()}>Try again</Button>
                </div>
              ) : (
                <ListSkeleton count={4} />
              )
            ) : posts.length === 0 ? (
              <EmptyState
                title={PERSONALITY.noPosts.title}
                description={PERSONALITY.noPosts.description}
                action={<Button asChild variant="secondary" className="rounded-full"><Link to="/friends">Find friends</Link></Button>}
              />
            ) : (
              <div className="pt-1">
                {posts.map((post, i) => (
                  <MotionCard key={post.id} index={i}>
                    {post.post_type === 'rivalry_announcement' ? (
                      <RivalryAnnouncementCard
                        post={post}
                        reactionCounts={countsByPost[post.id] || {}}
                        myEmoji={myEmojiByPost[post.id] || null}
                        onReact={react}
                        userId={user.id}
                        onDeleted={(id) => setPosts((prev) => (prev || []).filter((p) => p.id !== id))}
                      />
                    ) : (
                      <PostCard
                        post={post}
                        reactionCounts={countsByPost[post.id] || {}}
                        myEmoji={myEmojiByPost[post.id] || null}
                        onReact={react}
                        userId={user.id}
                        currentUserName={user.full_name}
                        friendRecordByUserId={friendRecords}
                        onDeleted={(id) => setPosts((prev) => (prev || []).filter((p) => p.id !== id))}
                      />
                    )}
                  </MotionCard>
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