import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Users } from 'lucide-react';

// Suggests friends-of-friends: people my accepted friends are also friends with,
// excluding myself and anyone I already have a relationship with. Reuses the
// already-fetched full Friend list (passed in) so no extra Friend API calls fire.
export default function RecommendedFriends({ allRecords, userId, relations, onAdd }) {
  const [suggestions, setSuggestions] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    compute();
  }, [allRecords, relations]);

  const compute = async () => {
    const myFriendIds = new Set(
      relations.filter((r) => r.status === 'accepted').map((r) =>
        r.created_by_id === userId ? r.addressee_id : r.created_by_id
      )
    );
    const knownIds = new Set(relations.map((r) =>
      r.created_by_id === userId ? r.addressee_id : r.created_by_id
    ));
    knownIds.add(userId);

    const mutual = {};
    allRecords.forEach((f) => {
      if (f.status !== 'accepted') return;
      let otherId, otherName;
      if (myFriendIds.has(f.created_by_id)) {
        otherId = f.addressee_id;
        otherName = f.addressee_name;
      } else if (myFriendIds.has(f.addressee_id)) {
        otherId = f.created_by_id;
        otherName = f.requester_name;
      } else {
        return;
      }
      if (knownIds.has(otherId)) return;
      if (!mutual[otherId]) mutual[otherId] = { id: otherId, name: otherName, mutualCount: 0 };
      mutual[otherId].mutualCount++;
    });

    const ranked = Object.values(mutual).sort((a, b) => b.mutualCount - a.mutualCount).slice(0, 5);
    // No extra API calls — derive suggestions purely from the already-fetched
    // Friend records (name + mutual count). Avatar shows initials via fallback.
    setSuggestions(ranked);
  };

  const handleAdd = (s) => {
    onAdd(s.id, s.name);
    setAddedIds(new Set([...addedIds, s.id]));
  };

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-heading font-bold text-sm px-4 mb-2 flex items-center gap-1.5">
        <Users className="w-4 h-4 text-primary" /> People You May Know
      </h3>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {suggestions.map((s) => (
          <div key={s.id} className="flex flex-col items-center bg-card rounded-2xl shadow-sm p-3 w-28 shrink-0">
            <Avatar className="w-14 h-14 mb-2">
              <AvatarFallback>{s.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-xs text-center truncate w-full">{s.name}</p>
            <p className="text-[10px] text-muted-foreground mb-2">{s.mutualCount} mutual friend{s.mutualCount !== 1 ? 's' : ''}</p>
            {addedIds.has(s.id) ? (
              <span className="text-[11px] text-muted-foreground font-semibold">Request sent</span>
            ) : (
              <Button size="sm" className="rounded-full h-7 text-xs w-full" onClick={() => handleAdd(s)}>
                <UserPlus className="w-3 h-3 mr-1" /> Add
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}