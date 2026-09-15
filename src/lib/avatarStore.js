import { useSyncExternalStore } from 'react';

// Global avatar store: the single authoritative source for the current user's
// profile picture during a session. When a user changes their avatar, every
// component reading from this store re-renders with the new image — no refresh,
// no navigation, no stale cached copies on old posts/challenges/notifications.
//
// The store holds userId -> { url, version }. Components call useAvatar(userId,
// fallback): if the store has a live entry for that user it wins, otherwise the
// fallback (the cached avatar_url on a Post/Notification/etc.) is used.

const listeners = new Set();
const store = new Map();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Update the live avatar for a user. Passing url=null/'' records "no avatar"
// (components fall back to the initial). Called after an upload and whenever a
// profile is freshly loaded.
export function setAvatar(userId, url) {
  if (!userId) return;
  const next = url || '';
  const existing = store.get(userId);
  if (existing && existing.url === next) return;
  store.set(userId, { url: next, version: Date.now() });
  emit();
}

// Hook: returns the live avatar URL for a user, falling back to the cached
// value (e.g. post.author_avatar) when the store has no live entry.
export function useAvatar(userId, fallback) {
  const entry = useSyncExternalStore(
    subscribe,
    () => store.get(userId),
    () => undefined
  );
  return entry?.url || fallback || '';
}