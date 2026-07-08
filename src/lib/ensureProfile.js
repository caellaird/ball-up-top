import { base44 } from '@/api/base44Client';

export async function getOrCreateProfile(user) {
  const existing = await base44.entities.Profile.filter({ created_by_id: user.id });
  if (existing.length > 0) return existing[0];
  const username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  return base44.entities.Profile.create({ username, bio: '', skill_level: 5 });
}

export async function getOrCreateStats(user) {
  const existing = await base44.entities.UserStats.filter({ created_by_id: user.id });
  if (existing.length > 0) return existing[0];
  return base44.entities.UserStats.create({ user_name: user.full_name, games_played: 0, games_won: 0, losses: 0, current_streak: 0, longest_streak: 0 });
}