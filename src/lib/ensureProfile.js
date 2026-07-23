import { base44 } from '@/api/base44Client';

export async function getOrCreateProfile(user) {
  const existing = await base44.entities.Profile.filter({ created_by_id: user.id });
  if (existing.length > 0) return existing[0];
  const username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  return base44.entities.Profile.create({ username, bio: '', skill_level: 5 });
}

export async function getOrCreateStats(user) {
  return getOrCreateStatsById(user.id, user.full_name);
}

export async function getOrCreateStatsById(userId, userName) {
  const existing = await base44.entities.UserStats.filter({ created_by_id: userId });
  if (existing.length > 0) return existing[0];
  return base44.entities.UserStats.create({ user_name: userName, games_played: 0, games_won: 0, losses: 0, current_streak: 0, longest_streak: 0 });
}

export async function recordGameResult(userId, userName, won) {
  const stats = await getOrCreateStatsById(userId, userName);
  return base44.entities.UserStats.update(stats.id, {
    games_played: (stats.games_played || 0) + 1,
    games_won: (stats.games_won || 0) + (won ? 1 : 0),
    losses: (stats.losses || 0) + (won ? 0 : 1),
    current_streak: won ? (stats.current_streak || 0) + 1 : 0,
    longest_streak: won ? Math.max((stats.current_streak || 0) + 1, stats.longest_streak || 0) : stats.longest_streak || 0,
  });
}