import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { enrichFriends } from '@/lib/friendsHelpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

export default function PlayerPicker({ user, selected, onChange }) {
  const [friends, setFriends] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    base44.entities.Friend.filter({ status: 'accepted' }).then(async (all) => {
      const mine = all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
      const enriched = await enrichFriends(mine, user.id);
      if (active) setFriends(enriched);
    });
    return () => { active = false; };
  }, [user.id]);

  const q = query.trim().toLowerCase();
  const list = (friends || []).filter((f) => !q
    || f.name?.toLowerCase().includes(q)
    || f.profile?.username?.toLowerCase().includes(q));

  const toggle = (f) => {
    const exists = selected.some((p) => p.user_id === f.userId);
    onChange(exists
      ? selected.filter((p) => p.user_id !== f.userId)
      : [...selected, { user_id: f.userId, name: f.name, avatar_url: f.profile?.avatar_url }]);
  };

  return (
    <div>
      <Input
        placeholder="Search friends..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-11 rounded-full mb-3"
      />
      {friends === null ? (
        <p className="text-sm text-muted-foreground">Loading friends...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {friends.length === 0 ? 'Add friends first so you can put them in a league.' : 'No friends match that search.'}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((f) => {
            const isSelected = selected.some((p) => p.user_id === f.userId);
            return (
              <button
                key={f.userId}
                type="button"
                onClick={() => toggle(f)}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl border-2 ${isSelected ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={f.profile?.avatar_url} />
                  <AvatarFallback>{f.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {f.profile?.username ? `@${f.profile.username}` : 'Friend'}
                  </p>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}