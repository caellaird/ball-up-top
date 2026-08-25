import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

// A single full-width settings row with an immediately-saved toggle.
// Optimistically flips the switch, persists via `onSave(checked)`, and rolls
// back to the previous value (showing an error) if the save fails — so a failed
// update can never make the UI falsely appear saved. Min 44px touch target.
export default function ToggleRow({ label, description, checked, onSave }) {
  const [value, setValue] = useState(checked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Keep local state in sync if the persisted value changes externally.
  React.useEffect(() => { setValue(checked); }, [checked]);

  const handle = async (next) => {
    const prev = value;
    setValue(next);
    setError('');
    setSaving(true);
    try {
      await onSave(next);
    } catch (e) {
      setValue(prev); // restore previous state on failure
      setError(e?.message || 'Couldn’t save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm break-words">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 break-words">{description}</p>}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <Switch checked={value} onCheckedChange={handle} disabled={saving} />
      </div>
    </div>
  );
}