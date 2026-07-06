import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function CreateGameDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', location_name: '', start_time: '', max_players: 10, description: '' });

  const submit = async () => {
    if (!form.title || !form.location_name || !form.start_time) return;
    setSaving(true);
    const user = await base44.auth.me();
    const game = await base44.entities.Game.create({ ...form, max_players: Number(form.max_players), creator_name: user.full_name });
    setSaving(false);
    setOpen(false);
    setForm({ title: '', location_name: '', start_time: '', max_players: 10, description: '' });
    onCreated(game);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">Create Game</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Game</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Location" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
          <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <Input type="number" placeholder="Max players" value={form.max_players} onChange={(e) => setForm({ ...form, max_players: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={submit} disabled={saving} className="w-full rounded-full">{saving ? 'Creating...' : 'Create Game'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}