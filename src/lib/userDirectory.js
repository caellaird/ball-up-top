import { base44 } from '@/api/base44Client';

// Cached directory of player profiles so challenge search can look across the
// whole eligible user base without a request per keystroke.
const TTL = 60000;
let cachedAt = 0;
let cachedList = null;
let pending = null;

export function loadProfileDirectory() {
  const now = Date.now();
  if (cachedList && now - cachedAt < TTL) return Promise.resolve(cachedList);
  if (pending) return pending;
  pending = base44.entities.Profile.list('-created_date', 500)
    .then((list) => {
      cachedList = list || [];
      cachedAt = Date.now();
      pending = null;
      return cachedList;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });
  return pending;
}