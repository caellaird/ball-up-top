import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { SPORTS } from '@/lib/constants';

// Nearby-competition notification preferences, persisted on the user's Profile.
// notify_nearby (on/off), notify_nearby_types (competition interests),
// notify_nearby_timing (newly posted / approaching / both).
export default function NearbyNotificationsSettings({ profile, setProfile }) {
  const [saving, setSaving] = useState(false);

  const update = async (patch) => {
    setSaving(true);
    try {
      const updated = await base44.entities.Profile.update(profile.id, patch);
      setProfile(updated);
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  const types = profile.notify_nearby_types || [];

  const toggleType = (key) => {
    const next = types.includes(key) ? types.filter((t) => t !== key) : [...types, key];
    update({ notify_nearby_types: next });
  };

  const timing = profile.notify_nearby_timing || 'new';

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="font-medium text-sm">Nearby Competition Alerts</p>
          <p className="text-xs text-muted-foreground">Get notified when public events are posted near you</p>
        </div>
        <Switch checked={!!profile.notify_nearby} onCheckedChange={(c) => update({ notify_nearby: c })} />
      </div>

      {profile.notify_nearby && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">I'm interested in</p>
            <div className="flex flex-wrap gap-2">
              {SPORTS.filter((s) => s.key !== 'custom').map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggleType(s.key)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border ${types.includes(s.key) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Leave all unchecked to get alerts for every competition type.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">When to notify</p>
            <div className="flex gap-2">
              {[
                { key: 'new', label: 'Newly posted' },
                { key: 'approaching', label: 'Approaching start' },
                { key: 'both', label: 'Both' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => update({ notify_nearby_timing: t.key })}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border ${timing === t.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {saving && <p className="text-xs text-muted-foreground">Saving…</p>}
        </div>
      )}
    </div>
  );
}