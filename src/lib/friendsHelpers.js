import { base44 } from '@/api/base44Client';

export function otherPartyId(f, userId) {
  return f.created_by_id === userId ? f.addressee_id : f.created_by_id;
}

export function otherPartyName(f, userId) {
  return f.created_by_id === userId ? f.addressee_name : f.requester_name;
}

// Returns enriched friend info: profile + stats for the "other side" of a Friend record
export async function enrichFriend(f, userId) {
  const otherId = otherPartyId(f, userId);
  const [profiles, statsList] = await Promise.all([
    base44.entities.Profile.filter({ created_by_id: otherId }),
    base44.entities.UserStats.filter({ created_by_id: otherId }),
  ]);
  return {
    friendRecordId: f.id,
    userId: otherId,
    name: otherPartyName(f, userId),
    profile: profiles[0] || null,
    stats: statsList[0] || null,
  };
}

// Enriches all friend records with a single bulk fetch for profiles + stats instead of
// firing two requests per friend (which can trip the API rate limit for large friend lists).
export async function enrichFriends(records, userId) {
  const otherIds = records.map((f) => otherPartyId(f, userId));
  const [allProfiles, allStats] = await Promise.all([
    base44.entities.Profile.list('-created_date', 500),
    base44.entities.UserStats.list('-created_date', 500),
  ]);
  const profileMap = new Map(allProfiles.map((p) => [p.created_by_id, p]));
  const statsMap = new Map(allStats.map((s) => [s.created_by_id, s]));
  return records.map((f, i) => {
    const otherId = otherIds[i];
    return {
      friendRecordId: f.id,
      userId: otherId,
      name: otherPartyName(f, userId),
      profile: profileMap.get(otherId) || null,
      stats: statsMap.get(otherId) || null,
    };
  });
}

// Finds an existing DM thread between two users, or creates one. Returns the Thread record.
export async function findOrCreateThread(userId, userName, otherId, otherName) {
  const existing = await base44.entities.Thread.filter({ type: 'dm' });
  let thread = existing.find((t) => t.participant_ids?.includes(otherId) && t.participant_ids?.includes(userId));
  if (!thread) {
    thread = await base44.entities.Thread.create({
      type: 'dm',
      participant_ids: [userId, otherId],
      participant_names: [userName, otherName],
    });
  }
  return thread;
}