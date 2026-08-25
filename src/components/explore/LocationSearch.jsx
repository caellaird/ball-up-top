import React, { useState, useRef, useEffect } from 'react';
import { searchLocations, reverseGeocode } from '@/lib/geo';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, LocateFixed } from 'lucide-react';

// Verified location picker for public-event creation. Searches Nominatim as the
// user types and requires a selected place with coordinates before proceeding.
export default function LocationSearch({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  const runSearch = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (q.trim().length < 3) { setResults([]); return; }
      setSearching(true);
      const r = await searchLocations(q);
      setResults(r);
      setSearching(false);
      setOpen(true);
    }, 400);
  };

  const pick = (r) => {
    onChange(r);
    setQuery(r.name);
    setOpen(false);
    setResults([]);
  };

  const useCurrent = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      pick(r);
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Where is the competition?"
            value={query}
            onChange={(e) => { setQuery(e.target.value); onChange(null); runSearch(e.target.value); }}
            onFocus={() => results.length && setOpen(true)}
            className="h-12 rounded-2xl pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <button
          type="button"
          onClick={useCurrent}
          className="h-12 px-4 rounded-2xl border border-border bg-card flex items-center gap-1.5 text-sm font-semibold shrink-0"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4 text-primary" />}
          Current
        </button>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-4 py-3 hover:bg-muted/60 flex items-start gap-2 border-b border-border last:border-0"
            >
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-3 p-3 rounded-2xl bg-accent/10 border border-accent/20">
          <p className="text-xs font-semibold text-accent mb-0.5">Verified location</p>
          <p className="text-sm font-semibold">{value.name}</p>
          <p className="text-xs text-muted-foreground">{value.address}</p>
        </div>
      )}
    </div>
  );
}