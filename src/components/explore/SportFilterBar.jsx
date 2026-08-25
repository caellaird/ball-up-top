import React from 'react';
import { SPORTS } from '@/lib/constants';

// Horizontally scrolling sport filter bar for the Explore map.
// `active` is a Set of sport keys; empty set means "All".
export default function SportFilterBar({ active, onToggle }) {
  const chips = [{ key: '__all', label: 'All', emoji: '🌐' }, ...SPORTS];
  const isActive = (key) => (key === '__all' ? active.size === 0 : active.has(key));

  const handle = (key) => {
    if (key === '__all') { onToggle(new Set()); return; }
    const next = new Set(active);
    if (next.has(key)) next.delete(key); else next.add(key);
    onToggle(next);
  };

  return (
    <div className="absolute left-0 right-0 top-4 z-[1000] px-4 pointer-events-none">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto py-1">
        {chips.map((s) => {
          const on = isActive(s.key);
          return (
            <button
              key={s.key}
              onClick={() => handle(s.key)}
              className={[
                'shrink-0 inline-flex items-center gap-1.5 h-9 rounded-full font-semibold whitespace-nowrap transition-colors font-heading',
                on
                  ? 'bg-white text-foreground ring-2 ring-primary shadow-sm pl-2.5 pr-3.5'
                  : 'bg-[#111827] text-white px-2.5',
              ].join(' ')}
            >
              <span className="text-base leading-none">{s.emoji}</span>
              {on && <span className="text-[13px]">{s.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}