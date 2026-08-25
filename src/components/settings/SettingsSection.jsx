import React from 'react';

// A labeled, full-width grouping of settings rows. Keeps the mobile Settings
// page in clean vertical sections without horizontal overflow.
export default function SettingsSection({ title, description, children }) {
  return (
    <section className="mb-6">
      <div className="px-4 mb-2">
        <h2 className="font-heading text-xs font-bold text-muted-foreground uppercase tracking-wide">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="mx-4 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {children}
      </div>
    </section>
  );
}