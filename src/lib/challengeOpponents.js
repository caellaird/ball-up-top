import { base44 } from '@/api/base44Client';
import { parseServerDate } from '@/lib/utils';

// Completed challenges only — both directions (as creator and as opponent).
// Used by challenge creation to derive Recently Challenged and Most Played.
function completedTime(challenge) {
  const parsed = parseServerDate(challenge.completed_at || challenge.updated_date || challenge.created_date);
  return parsed ? parsed.getTime() : 0;
}

export function opponentIdsOf(challenge, userId) {
  const ids = [];
  if (challenge.created_by_id === userId) {
    if (challenge.opponent_ids?.length) ids.push(...challenge.opponent_ids);
    if (challenge.opponent_id) ids.push(challenge.opponent_id);
  } else {
    if (challenge.created_by_id) ids.push(challenge.created_by_id);
    if (challenge.opponent_ids?.length) ids.push(...challenge.opponent_ids);
    if (challenge.opponent_id) ids.push(challenge.opponent_id);
  }
  return [...new Set(ids.filter((id) => id && id !== userId))];
}

export async function loadCompletedChallenges(userId) {
  // Sequential (not Promise.all) so the two queries never land in the same burst.
  const asCreator = await base44.entities.Challenge.filter(
    { created_by_id: userId, status: 'completed' }, '-created_date', 100,
  );
  const asOpponent = await base44.entities.Challenge.filter(
    { opponent_id: userId, status: 'completed' }, '-created_date', 100,
  );
  const byId = new Map();
  [...(asCreator || []), ...(asOpponent || [])].forEach((c) => {
    if (c?.id && c.status === 'completed') byId.set(c.id, c);
  });
  return [...byId.values()].sort((a, b) => completedTime(b) - completedTime(a));
}

// The 7 most recent UNIQUE opponents — a person occupies one slot no matter how
// many times they have played, positioned by their latest completed challenge.
export function buildRecentOpponents(challenges, userId, friends = [], limit = 7) {
  const nameById = new Map();
  const remember = (id, name) => {
    if (id && name && !nameById.has(id)) nameById.set(id, name);
  };
  challenges.forEach((c) => {
    remember(c.created_by_id, c.creator_name);
    remember(c.opponent_id, c.opponent_name);
    (c.opponent_ids || []).forEach((id, i) => remember(id, c.opponent_names?.[i]));
    (c.participant_statuses || []).forEach((p) => remember(p.user_id, p.name));
  });

  const latest = new Map();
  challenges.forEach((c) => {
    const time = completedTime(c);
    opponentIdsOf(c, userId).forEach((id) => {
      if (!latest.has(id) || time > latest.get(id)) latest.set(id, time);
    });
  });

  const friendById = new Map((friends || []).map((f) => [f.userId, f]));
  return [...latest.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, lastPlayedAt]) => {
      const friend = friendById.get(id);
      return {
        userId: id,
        lastPlayedAt,
        name: friend?.name || nameById.get(id) || 'Player',
        username: friend?.profile?.username || null,
        avatar: friend?.profile?.avatar_url || null,
      };
    });
}

// Friends ranked by how many completed challenges they share with the user.
export function buildMostPlayedFriends(challenges, friends = [], userId, limit = 5) {
  const counts = new Map();
  challenges.forEach((c) => {
    opponentIdsOf(c, userId).forEach((id) => {
      counts.set(id, (counts.get(id) || 0) + 1);
    });
  });
  return (friends || [])
    .map((f) => ({ ...f, plays: counts.get(f.userId) || 0 }))
    .sort((a, b) => b.plays - a.plays || String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, limit);
}