import React from 'react';
import { SPORT_EMOJI, SPORT_LABEL } from '@/lib/constants';
import { resolveSportKey } from '@/lib/favoriteSport';

const SPORTS = Object.keys(SPORT_EMOJI);

// Emoji selection menu for a user's favorite sport. Clicking a sport registers
// its key as the value, which drives the profile banner and the sport shown
// under the username.
export default function FavoriteSportPicker({ value, onChange }) {
  const selected = resolveSportKey(value);
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Favorite sport</label>
      <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
        {SPORTS.map((key) => {
          const active = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'}`}
            >
              <span className="text-2xl leading-none">{SPORT_EMOJI[key]}</span>
              <span className={`text-[11px] font-semibold capitalize ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {SPORT_LABEL[key] || key}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}