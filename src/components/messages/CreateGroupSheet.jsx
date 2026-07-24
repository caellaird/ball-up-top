import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { enrichFriends } from '@/lib/friendsHelpers';

export default function CreateGroupSheet({ open, onOpenChange, user, onCreated }) {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) load();
  }, [open]);

  const load = async () => {
    const all = await base44.entities.Friend.filter({ status: 'accepted' });
    const mine = all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
    setFriends(await enrichFriends(mine, user.id));
    setSelected([]);
    setName('');
  };

  const toggle = (friend) => {
    setSelected((prev) =>
      prev.some((f) => f.userId === friend.userId) ? prev.filter((f) => f.userId !== friend.userId) : [...prev, friend]
    );
  };

  const create = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    const thread = await base44.entities.Thread.create({
      type: 'group',
      name: name.trim() || selected.map((f) => f.name).join(', '),
      participant_ids: [user.id, ...selected.map((f) => f.userId)],
      participant_names: [user.full_name, ...selected.map((f) => f.name)],
    });
    setSaving(false);
    onCreated(thread);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle className="font-heading">New Group</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <Input placeholder="Group name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <p className="text-xs text-muted-foreground">Select friends to add</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {friends.map((f) => {
              const isSelected = selected.some((s) => s.userId === f.userId);
              return (
                <button
                  key={f.friendRecordId}
                  onClick={() => toggle(f)}
                  className={`w-full flex items-center gap-3 rounded-xl p-2 border transition ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={f.profile?.avatar_url} />
                    <AvatarFallback>{f.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{f.name}</span>
                </button>
              );
            })}
            {friends.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No friends yet.</p>}
          </div>
          <Button onClick={create} disabled={selected.length === 0 || saving} className="w-full rounded-full h-12">
            {saving ? 'Creating...' : `Create Group${selected.length ? ` (${selected.length + 1})` : ''}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}