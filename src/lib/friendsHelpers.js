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

export async function enrichFriends(records, userId) {
  return Promise.all(records.map((f) => enrichFriend(f, userId)));
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