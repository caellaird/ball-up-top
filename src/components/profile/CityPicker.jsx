import React, { useMemo, useState } from 'react';
import { MapPin, Search, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { searchCities } from '@/lib/cities';

// Picks the player's real home city from a curated list, so every competition
// they play in credits a properly-keyed city on the yearly leaderboard.
export default function CityPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCities(query), [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => { setQuery(''); setOpen(true); }}
        className="w-full flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-transparent text-left"
      >
        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className={`flex-1 text-sm truncate ${value ? '' : 'text-muted-foreground'}`}>
          {value || 'Pick your city'}
        </span>
        <span className="text-xs text-primary font-semibold shrink-0">Change</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-left font-heading">Where are you from?</SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mt-1 text-left">
            Your city gets a point every time you compete.
          </p>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search cities"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="mt-3 flex-1 overflow-y-auto overscroll-contain pb-6">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No cities found.</p>
            ) : (
              <div className="space-y-1">
                {results.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => { onChange(c); setOpen(false); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left"
                  >
                    <span className="text-sm font-medium">{c.label}</span>
                    {value === c.label && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}