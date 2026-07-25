import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { enrichFriends, findOrCreateThread } from '@/lib/friendsHelpers';

export default function NewDmSheet({ open, onOpenChange, user, onCreated }) {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) load();
  }, [open]);

  const load = async () => {
    const all = await base44.entities.Friend.filter({ status: 'accepted' });
    const mine = all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
    setFriends(await enrichFriends(mine, user.id));
  };

  const start = async (friend) => {
    const thread = await findOrCreateThread(user.id, user.full_name, friend.userId, friend.name);
    onCreated(thread);
  };

  const filtered = friends.filter((f) => {
    const q = search.trim().toLowerCase();
    return !q || f.name?.toLowerCase().includes(q);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle className="font-heading">New Message</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <Input placeholder="Search friends..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" />
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filtered.map((f) => (
              <button
                key={f.friendRecordId}
                onClick={() => start(f)}
                className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={f.profile?.avatar_url} />
                  <AvatarFallback>{f.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{f.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No friends found.</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}