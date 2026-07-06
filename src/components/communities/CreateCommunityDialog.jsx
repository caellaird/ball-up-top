import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function CreateCommunityDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', city: '' });

  const submit = async () => {
    if (!form.name) return;
    setSaving(true);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const community = await base44.entities.Community.create({ ...form, slug });
    await base44.entities.CommunityMember.create({ community_id: community.id, role: 'owner' });
    setSaving(false);
    setOpen(false);
    setForm({ name: '', description: '', city: '' });
    onCreated(community);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">Create Community</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Community</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={submit} disabled={saving} className="w-full rounded-full">{saving ? 'Creating...' : 'Create Community'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}