import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_REACTION } from '@/lib/reactions';

// Loads Like records for the given post ids and exposes helpers to add,
// change, or remove the current user's single reaction per post.
//
// One Like record per user per post is enforced here: changing an emoji
// updates the existing record; toggling the same emoji deletes it. Counts are
// derived from the loaded records, so they stay accurate across navigation
// and app restarts (the records are the source of truth).
export function useReactions(postIds, currentUserId) {
  const [likesByPost, setLikesByPost] = useState({}); // { [postId]: Like[] }
  const [myLikeByPost, setMyLikeByPost] = useState({}); // { [postId]: Like }
  const [reloadTick, setReloadTick] = useState(0);

  const key = JSON.stringify(postIds || []);

  // Refetch when the page regains focus so reactions from other users appear
  // without a manual refresh (matches the app's existing focus-refresh pattern).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') setReloadTick((t) => t + 1);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // (Re)load likes whenever the set of visible post ids changes.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const ids = Array.from(new Set((postIds || []).filter(Boolean)));
      if (!ids.length) {
        setLikesByPost({});
        setMyLikeByPost({});
        return;
      }
      try {
        const likes = await base44.entities.Like.filter({ post_id: { $in: ids } });
        if (cancelled) return;
        const byPost = {};
        const mine = {};
        for (const l of likes) {
          (byPost[l.post_id] = byPost[l.post_id] || []).push(l);
          if (l.created_by_id === currentUserId) mine[l.post_id] = l;
        }
        setLikesByPost(byPost);
        setMyLikeByPost(mine);
      } catch {
        // ignore — reactions simply won't render until next load
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, currentUserId, reloadTick]);

  // Add / change / remove the current user's reaction on a post.
  const react = useCallback(
    async (post, emoji) => {
      const postId = post?.id || post;
      const existing = myLikeByPost[postId];
      const isSame = existing && existing.emoji === emoji;

      // Optimistic local update so counts/own-highlight change instantly.
      setLikesByPost((prev) => {
        const list = (prev[postId] || []).slice();
        if (isSame) {
          const idx = list.findIndex((l) => l.id === existing.id);
          if (idx >= 0) list.splice(idx, 1);
        } else if (existing) {
          const idx = list.findIndex((l) => l.id === existing.id);
          if (idx >= 0) list[idx] = { ...list[idx], emoji };
        } else {
          list.push({ id: `tmp_${Date.now()}`, post_id: postId, emoji, created_by_id: currentUserId });
        }
        return { ...prev, [postId]: list };
      });
      setMyLikeByPost((prev) => {
        if (isSame) {
          const next = { ...prev };
          delete next[postId];
          return next;
        }
        if (existing) return { ...prev, [postId]: { ...existing, emoji } };
        return { ...prev, [postId]: { id: `tmp_${Date.now()}`, post_id: postId, emoji, created_by_id: currentUserId } };
      });

      // Persist to the server.
      try {
        if (isSame) {
          await base44.entities.Like.delete(existing.id);
        } else if (existing) {
          await base44.entities.Like.update(existing.id, { emoji });
        } else {
          const created = await base44.entities.Like.create({ post_id: postId, emoji });
          // Resolve the optimistic temp id with the real record.
          setLikesByPost((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).map((l) => (String(l.id).startsWith('tmp_') ? created : l)),
          }));
          setMyLikeByPost((prev) => ({ ...prev, [postId]: created }));
        }
      } catch {
        // Re-sync this post's reactions on failure and clear any optimistic
        // (temp) state so the UI never stays stuck on a reaction that didn't save.
        try {
          const likes = await base44.entities.Like.filter({ post_id: { $in: [postId] } });
          const byPost = {};
          const mine = {};
          for (const l of likes) {
            (byPost[l.post_id] = byPost[l.post_id] || []).push(l);
            if (l.created_by_id === currentUserId) mine[l.post_id] = l;
          }
          setLikesByPost((prev) => {
            const next = { ...prev };
            next[postId] = byPost[postId] || [];
            return next;
          });
          setMyLikeByPost((prev) => {
            const next = { ...prev };
            if (mine[postId]) next[postId] = mine[postId];
            else delete next[postId];
            return next;
          });
        } catch {
          /* ignore */
        }
      }
    },
    [myLikeByPost, currentUserId]
  );

  const countsByPost = useMemo(() => {
    const out = {};
    for (const [pid, likes] of Object.entries(likesByPost)) {
      const counts = {};
      for (const l of likes) {
        const e = l.emoji || DEFAULT_REACTION;
        counts[e] = (counts[e] || 0) + 1;
      }
      out[pid] = counts;
    }
    return out;
  }, [likesByPost]);

  const myEmojiByPost = useMemo(() => {
    const out = {};
    for (const [pid, l] of Object.entries(myLikeByPost)) out[pid] = l.emoji || DEFAULT_REACTION;
    return out;
  }, [myLikeByPost]);

  return { countsByPost, myEmojiByPost, react };
}