import { base44 } from '@/api/base44Client';

// Short-lived in-memory cache + in-flight de-duplication.
// All four tab pages (Home, Challenges, Groups, Profile) mount at the same
// time and each calls getOrCreateProfile/getOrCreateStats — without caching
// that fires 4+ identical API calls in a burst and trips the rate limit.
const CACHE_TTL = 30000; // 30s
const _cache = new Map(); // key -> { value, expiresAt }
const _pending = new Map(); // key -> Promise (in-flight)

async function cached(key, fetcher) {
  const now = Date.now();
  const hit = _cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;
  if (_pending.has(key)) return _pending.get(key);
  const p = fetcher()
    .then((value) => {
      _cache.set(key, { value, expiresAt: now + CACHE_TTL });
      _pending.delete(key);
      return value;
    })
    .catch((err) => {
      _pending.delete(key);
      throw err;
    });
  _pending.set(key, p);
  return p;
}

export async function getOrCreateProfile(user) {
  return cached(`profile:${user.id}`, async () => {
    const existing = await base44.entities.Profile.filter({ created_by_id: user.id });
    if (existing.length > 0) return existing[0];
    const username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    return base44.entities.Profile.create({ username, bio: '', skill_level: 5 });
  });
}

// Invalidate the cached profile so updates (e.g. editing profile, toggling
// ready-to-ball) are reflected on the next read.
export function invalidateProfile(userId) {
  _cache.delete(`profile:${userId}`);
}

export async function getOrCreateStats(user) {
  return getOrCreateStatsById(user.id, user.full_name);
}

export async function getOrCreateStatsById(userId, userName) {
  return cached(`stats:${userId}`, async () => {
    const existing = await base44.entities.UserStats.filter({ created_by_id: userId });
    if (existing.length > 0) return existing[0];
    return base44.entities.UserStats.create({ user_name: userName, games_played: 0, games_won: 0, losses: 0, current_streak: 0, longest_streak: 0 });
  });
}

// Cached wrapper for the heavy computeProfileStats call (5+ API calls each
// profile mount). Same TTL/pending de-dup so tab-switches and re-mounts reuse
// the result instead of firing another burst.
export async function getCachedProfileStats(userId) {
  return cached(`profileStats:${userId}`, async () => {
    const { computeProfileStats } = await import('@/lib/profileStats');
    return computeProfileStats(userId);
  });
}

export function invalidateProfileStats(userId) {
  _cache.delete(`profileStats:${userId}`);
}

export function invalidateStats(userId) {
  _cache.delete(`stats:${userId}`);
}

export async function recordGameResult(userId, userName, won) {
  const stats = await getOrCreateStatsById(userId, userName);
  const updated = base44.entities.UserStats.update(stats.id, {
    games_played: (stats.games_played || 0) + 1,
    games_won: (stats.games_won || 0) + (won ? 1 : 0),
    losses: (stats.losses || 0) + (won ? 0 : 1),
    current_streak: won ? (stats.current_streak || 0) + 1 : 0,
    longest_streak: won ? Math.max((stats.current_streak || 0) + 1, stats.longest_streak || 0) : stats.longest_streak || 0,
  });
  invalidateStats(userId);
  return updated;
}