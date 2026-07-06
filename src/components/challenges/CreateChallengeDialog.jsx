import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

export default function CreateChallengeDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'head_to_head', start_date: '', end_date: '', rules: '' });

  const submit = async () => {
    if (!form.title || !form.start_date || !form.end_date) return;
    setSaving(true);
    const user = await base44.auth.me();
    const challenge = await base44.entities.Challenge.create({ ...form, creator_name: user.full_name });
    await base44.entities.ChallengeParticipant.create({ challenge_id: challenge.id, user_name: user.full_name });
    setSaving(false);
    setOpen(false);
    setForm({ title: '', description: '', type: 'head_to_head', start_date: '', end_date: '', rules: '' });
    onCreated(challenge);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">Create Challenge</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Challenge</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="head_to_head">Head-to-Head</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="streak">Streak</SelectItem>
              <SelectItem value="skill">Skill</SelectItem>
              <SelectItem value="trash_talk">Trash Talk</SelectItem>
            </SelectContent>
          </Select>
          <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={submit} disabled={saving} className="w-full rounded-full">{saving ? 'Creating...' : 'Create Challenge'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}