import React from 'react';

const TABS = [
  { key: 'activity', label: 'Activity', emoji: '📈' },
  { key: 'stats', label: 'Stats', emoji: '🏆' },
  { key: 'friends', label: 'Friends', emoji: '🤝' },
  { key: 'awards', label: 'Awards', emoji: '🏅' },
  { key: 'highlights', label: 'Highlights', emoji: '📸' },
];

export default function ProfileTabs({ active, onChange }) {
  return (
    <div className="shrink-0 flex border-b border-border bg-background overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 min-w-[64px] flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold border-b-2 transition ${
            active === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <span className="text-base leading-none">{t.emoji}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}