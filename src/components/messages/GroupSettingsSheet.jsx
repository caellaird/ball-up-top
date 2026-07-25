import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { enrichFriends } from '@/lib/friendsHelpers';
import { LogOut, X, Crown, UserPlus } from 'lucide-react';

export default function GroupSettingsSheet({ open, onOpenChange, thread, user, onUpdated, onLeave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && thread) {
      setName(thread.name || '');
      setDescription(thread.description || '');
      loadFriends();
    }
  }, [open, thread?.id]);

  const loadFriends = async () => {
    const all = await base44.entities.Friend.filter({ status: 'accepted' });
    const mine = all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
    const enriched = await enrichFriends(mine, user.id);
    setFriends(enriched.filter((f) => !thread.participant_ids?.includes(f.userId)));
  };

  const save = async () => {
    setSaving(true);
    const updated = await base44.entities.Thread.update(thread.id, {
      name: name.trim(),
      description: description.trim(),
    });
    setSaving(false);
    onUpdated(updated);
    onOpenChange(false);
  };

  const removeMember = async (memberId) => {
    const newIds = thread.participant_ids.filter((id) => id !== memberId);
    const newNames = thread.participant_names.filter((_, i) => thread.participant_ids[i] !== memberId);
    const updated = await base44.entities.Thread.update(thread.id, {
      participant_ids: newIds,
      participant_names: newNames,
    });
    onUpdated(updated);
  };

  const addMember = async (friend) => {
    const newIds = [...(thread.participant_ids || []), friend.userId];
    const newNames = [...(thread.participant_names || []), friend.name];
    const updated = await base44.entities.Thread.update(thread.id, {
      participant_ids: newIds,
      participant_names: newNames,
    });
    onUpdated(updated);
    loadFriends();
    setShowAdd(false);
  };

  const leave = async () => {
    const newIds = thread.participant_ids.filter((id) => id !== user.id);
    const newNames = thread.participant_names.filter((_, i) => thread.participant_ids[i] !== user.id);
    await base44.entities.Thread.update(thread.id, {
      participant_ids: newIds,
      participant_names: newNames,
    });
    onOpenChange(false);
    onLeave();
  };

  if (!thread) return null;
  const isAdmin = thread.admin_ids?.includes(user.id) || thread.created_by_id === user.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle className="font-heading">Group Settings</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-16 h-16">
              <AvatarImage src={thread.avatar_url} />
              <AvatarFallback className="text-xl">{(thread.name || 'G')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
            </div>
          </div>
          <Textarea placeholder="Group description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isAdmin} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Members ({thread.participant_ids?.length})</p>
              {isAdmin && (
                <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-primary font-semibold flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>
            <div className="space-y-2">
              {thread.participant_ids?.map((id, i) => (
                <div key={id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
                  <Avatar className="w-8 h-8"><AvatarFallback>{thread.participant_names?.[i]?.[0]}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium flex-1">{thread.participant_names?.[i]}</span>
                  {(id === thread.created_by_id || thread.admin_ids?.includes(id)) && <Crown className="w-3.5 h-3.5 text-accent" />}
                  {isAdmin && id !== user.id && id !== thread.created_by_id && (
                    <button onClick={() => removeMember(id)} className="text-destructive"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showAdd && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {friends.map((f) => (
                <button key={f.userId} onClick={() => addMember(f)} className="w-full flex items-center gap-3 p-2 rounded-xl border border-border">
                  <Avatar className="w-8 h-8"><AvatarFallback>{f.name?.[0]}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">{f.name}</span>
                </button>
              ))}
              {friends.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">All friends are already in the group.</p>}
            </div>
          )}

          {isAdmin && <Button onClick={save} disabled={saving} className="w-full rounded-full h-12">Save Changes</Button>}
          <Button onClick={leave} variant="outline" className="w-full rounded-full h-12 text-destructive border-destructive/30">
            <LogOut className="w-4 h-4 mr-2" /> Leave Group
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}