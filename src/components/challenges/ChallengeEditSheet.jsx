import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function ChallengeEditSheet({ open, onOpenChange, challenge, onSaved }) {
  const [location, setLocation] = useState(challenge.location_name || '');
  const [date, setDate] = useState(challenge.scheduled_time ? challenge.scheduled_time.slice(0, 16) : '');
  const [notes, setNotes] = useState(challenge.notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const updated = await base44.entities.Challenge.update(challenge.id, {
      location_name: location,
      scheduled_time: date ? new Date(date).toISOString() : undefined,
      notes,
    });
    setSaving(false);
    onSaved(updated);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle className="font-heading">Edit Challenge</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 rounded-2xl" />
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-2xl" />
          <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button onClick={save} disabled={saving} className="w-full rounded-full h-12">{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}