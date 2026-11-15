// Approximate player search used when picking a challenge opponent.
// Matches partial names (first/last), usernames and close misspellings, and
// ranks existing friends ahead of everyone else.

const MAX_RESULTS = 25;

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }
  return prev[b.length];
}

function scoreField(query, value) {
  const field = normalizeText(value);
  if (!field) return Infinity;
  if (field === query) return 0;
  if (field.startsWith(query)) return 1;
  if (field.split(' ').some((word) => word.startsWith(query))) return 1.5;
  if (field.includes(query)) return 2;
  const tolerance = query.length <= 3 ? 1 : query.length <= 6 ? 2 : 3;
  const closest = Math.min(
    levenshtein(query, field),
    ...field.split(' ').map((word) => levenshtein(query, word)),
  );
  if (closest <= tolerance) return 4 + closest;
  return Infinity;
}

export function buildCandidates({ friends = [], profiles = [], userId }) {
  const byUserId = new Map();
  (friends || []).forEach((f) => {
    if (!f?.userId || f.userId === userId) return;
    byUserId.set(f.userId, {
      userId: f.userId,
      name: f.name || f.profile?.username || 'Player',
      username: f.profile?.username || null,
      avatar: f.profile?.avatar_url || null,
      isFriend: true,
    });
  });
  (profiles || []).forEach((p) => {
    const id = p?.created_by_id;
    if (!id || id === userId || byUserId.has(id)) return;
    // Respect the player's privacy choice: private profiles are not searchable.
    if (p.privacy_level === 'private') return;
    byUserId.set(id, {
      userId: id,
      name: p.nickname || p.username || 'Player',
      username: p.username || null,
      avatar: p.avatar_url || null,
      isFriend: false,
    });
  });
  return [...byUserId.values()];
}

export function searchUsers(query, context) {
  const q = normalizeText(query);
  if (!q) return [];
  const scored = [];
  buildCandidates(context).forEach((candidate) => {
    const score = Math.min(scoreField(q, candidate.name), scoreField(q, candidate.username));
    if (!Number.isFinite(score)) return;
    scored.push({ ...candidate, score: score - (candidate.isFriend ? 0.5 : 0) });
  });
  scored.sort((a, b) => a.score - b.score || String(a.name).localeCompare(String(b.name)));
  return scored.slice(0, MAX_RESULTS);
}