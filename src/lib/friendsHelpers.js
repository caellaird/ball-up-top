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