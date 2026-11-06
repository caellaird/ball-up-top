import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddSessionSheet({ open, onOpenChange, onCreate }) {
  const [startTime, setStartTime] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStartTime('');
      setNote('');
      setSaving(false);
    }
  }, [open]);

  const create = async () => {
    setSaving(true);
    try {
      await onCreate({ start_time: new Date(startTime).toISOString(), note: note.trim() });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-heading">Add a time</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-4">
          <p className="text-xs font-semibold text-muted-foreground">Date & time</p>
          <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12 rounded-2xl" />
          <p className="text-xs font-semibold text-muted-foreground">Note (optional)</p>
          <Input placeholder="e.g. Court 2, bring a ball" value={note} onChange={(e) => setNote(e.target.value)} className="h-12 rounded-2xl" />
          <Button onClick={create} disabled={!startTime || saving} className="w-full rounded-full h-12">
            {saving ? 'Adding...' : 'Add time'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}