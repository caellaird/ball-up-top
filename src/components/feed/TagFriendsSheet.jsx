import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { enrichFriends } from '@/lib/friendsHelpers';

export default function TagFriendsSheet({ open, onOpenChange, userId, initialSelected = [], onConfirm }) {
  const [friends, setFriends] = useState(null);
  const [selected, setSelected] = useState(initialSelected.map((f) => f.id));

  useEffect(() => {
    if (open && userId) {
      setFriends(null);
      setSelected(initialSelected.map((f) => f.id));
      load();
    }
  }, [open, userId]);

  const load = async () => {
    const [asRequester, asAddressee] = await Promise.all([
      base44.entities.Friend.filter({ created_by_id: userId, status: 'accepted' }),
      base44.entities.Friend.filter({ addressee_id: userId, status: 'accepted' }),
    ]);
    const enriched = await enrichFriends([...asRequester, ...asAddressee], userId);
    setFriends(enriched);
  };

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirm = () => {
    const chosen = (friends || [])
      .filter((f) => selected.includes(f.userId))
      .map((f) => ({ id: f.userId, name: f.name, username: f.profile?.username || '' }));
    onConfirm(chosen);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Tag Players</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {friends === null ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading friends...</p>
          ) : friends.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No friends yet.</p>
          ) : (
            friends.map((f) => (
              <button
                key={f.userId}
                onClick={() => toggle(f.userId)}
                className={`w-full flex items-center gap-3 rounded-2xl p-3 border ${selected.includes(f.userId) ? 'border-accent bg-accent/10' : 'border-border'}`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={f.profile?.avatar_url} />
                  <AvatarFallback>{f.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm truncate">{f.name}</p>
                  {f.profile?.username && <p className="text-xs text-muted-foreground truncate">@{f.profile.username}</p>}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected.includes(f.userId) ? 'border-accent bg-accent' : 'border-border'}`}>
                  {selected.includes(f.userId) && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))
          )}
        </div>
        <Button onClick={confirm} className="w-full rounded-full h-12 mt-4">Done</Button>
      </SheetContent>
    </Sheet>
  );
}