import { base44 } from '@/api/base44Client';

// Fetches all rivalries for a user, sorted by most recent game.
export async function fetchUserRivalries(userId) {
  const [asA, asB] = await Promise.all([
    base44.entities.Rivalry.filter({ user_a_id: userId }),
    base44.entities.Rivalry.filter({ user_b_id: userId }),
  ]);
  const all = [...asA, ...asB];
  all.sort((a, b) => new Date(b.last_game_at || b.updated_date) - new Date(a.last_game_at || a.updated_date));
  return all;
}

// Returns the rivalry to display as "Current Rival" on a profile.
// Uses manual selection if set, otherwise auto-selects the most recent.
export async function fetchCurrentRival(userId, profile) {
  if (profile?.current_rival_id) {
    try {
      const rivalry = await base44.entities.Rivalry.get(profile.current_rival_id);
      if (rivalry) return rivalry;
    } catch { /* fall through to auto */ }
  }
  const rivalries = await fetchUserRivalries(userId);
  // Auto-select: most frequent opponent (highest total_games), recency as tiebreaker
  const eligible = rivalries.filter((r) => (r.total_games || 0) >= 2);
  const pool = (eligible.length ? eligible : rivalries);
  pool.sort((a, b) => (b.total_games || 0) - (a.total_games || 0)
    || new Date(b.last_game_at || b.updated_date) - new Date(a.last_game_at || a.updated_date));
  return (pool[0] || null);
}

export async function fetchRivalry(rivalryId) {
  return await base44.entities.Rivalry.get(rivalryId);
}

// Returns completed challenges between two users, sorted newest first.
export async function fetchRivalryHistory(userAId, userBId) {
  const [aCreated, bCreated] = await Promise.all([
    base44.entities.Challenge.filter({ created_by_id: userAId, status: 'completed' }),
    base44.entities.Challenge.filter({ created_by_id: userBId, status: 'completed' }),
  ]);
  const between = [
    ...aCreated.filter((c) => c.opponent_id === userBId || c.opponent_ids?.includes(userBId)),
    ...bCreated.filter((c) => c.opponent_id === userAId || c.opponent_ids?.includes(userAId)),
  ];
  return between.sort((a, b) => new Date(b.completed_at || b.updated_date) - new Date(a.completed_at || a.updated_date));
}

// Returns the "other" user in a rivalry (the opponent of currentUserId).
export function getRival(rivalry, currentUserId) {
  if (rivalry.user_a_id === currentUserId) {
    return { id: rivalry.user_b_id, name: rivalry.user_b_name, avatar: rivalry.user_b_avatar, wins: rivalry.user_b_wins || 0 };
  }
  return { id: rivalry.user_a_id, name: rivalry.user_a_name, avatar: rivalry.user_a_avatar, wins: rivalry.user_a_wins || 0 };
}

// Returns the current user's info within a rivalry.
export function getSelf(rivalry, currentUserId) {
  if (rivalry.user_a_id === currentUserId) {
    return { id: rivalry.user_a_id, name: rivalry.user_a_name, avatar: rivalry.user_a_avatar, wins: rivalry.user_a_wins || 0 };
  }
  return { id: rivalry.user_b_id, name: rivalry.user_b_name, avatar: rivalry.user_b_avatar, wins: rivalry.user_b_wins || 0 };
}