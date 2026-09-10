import React, { useState, useRef, useEffect } from 'react';
import { searchLocations, reverseGeocode, haversineMiles } from '@/lib/geo';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, LocateFixed, Star, Clock, Flame, Heart } from 'lucide-react';
import { getRecents, addRecent, getFavorites, toggleFavorite, isFavorite } from '@/lib/locationStorage';
import LocationResultRow from '@/components/explore/LocationResultRow';

const POPULAR_RADIUS_MI = 25;

// Verified location picker for public-event creation. Prioritizes nearby results,
// shows recents + favorites + popular-in-your-area, and lets users star locations.
export default function LocationSearch({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [recents, setRecents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [popular, setPopular] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  // Load user position + stored lists on mount.
  useEffect(() => {
    setRecents(getRecents());
    setFavorites(getFavorites());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch popular locations near the user from active public events.
  const loadPopular = async (lat, lng) => {
    setPopularLoading(true);
    try {
      const events = await base44.entities.PublicEvent.filter({ status: 'active' });
      const nearby = events.filter(
        (e) => e.latitude != null && e.longitude != null &&
          haversineMiles(lat, lng, e.latitude, e.longitude) <= POPULAR_RADIUS_MI
      );
      // Group by rounded coordinates and count occurrences.
      const map = new Map();
      nearby.forEach((e) => {
        const key = `${e.latitude.toFixed(3)},${e.longitude.toFixed(3)}`;
        if (map.has(key)) {
          map.get(key).count++;
        } else {
          map.set(key, {
            name: e.location_name || e.verified_address || 'Game location',
            address: e.verified_address || e.location_name || '',
            lat: e.latitude,
            lng: e.longitude,
            count: 1,
          });
        }
      });
      setPopular([...map.values()].sort((a, b) => b.count - a.count).slice(0, 5));
    } catch { /* ignore */ }
    setPopularLoading(false);
  };

  useEffect(() => {
    if (userPos) loadPopular(userPos.lat, userPos.lng);
  }, [userPos]);

  // Close dropdown on outside click.
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSearch = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (q.trim().length < 3) { setResults([]); return; }
      setSearching(true);
      const r = await searchLocations(q, userPos?.lat, userPos?.lng);
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
    addRecent(r);
    setRecents(getRecents());
  };

  const handleToggleFav = (r) => {
    const nowFav = toggleFavorite(r);
    setFavorites(getFavorites());
    // If currently showing recents/popular, update favorited state via re-read.
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

  const distFor = (r) => (userPos ? haversineMiles(userPos.lat, userPos.lng, r.lat, r.lng) : null);
  const showSections = open && query.trim().length < 3;
  const hasSections = favorites.length > 0 || recents.length > 0 || popular.length > 0 || popularLoading;

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Where is the competition?"
            value={query}
            onChange={(e) => { setQuery(e.target.value); onChange(null); runSearch(e.target.value); }}
            onFocus={() => setOpen(true)}
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

      {/* Search results (typing, 3+ chars) */}
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
          {results.map((r, i) => (
            <LocationResultRow
              key={`r-${i}`}
              result={r}
              distance={distFor(r)}
              favorited={isFavorite(r)}
              onPick={() => pick(r)}
              onToggleFav={() => handleToggleFav(r)}
            />
          ))}
        </div>
      )}

      {/* Quick-access sections (empty or short query) */}
      {showSections && hasSections && (
        <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
          {/* Favorites */}
          {favorites.length > 0 && (
            <Section title="Favorites" icon={<Heart className="w-3.5 h-3.5 text-accent" />}>
              {favorites.map((r, i) => (
                <LocationResultRow
                  key={`f-${i}`}
                  result={r}
                  distance={distFor(r)}
                  favorited={true}
                  onPick={() => pick(r)}
                  onToggleFav={() => handleToggleFav(r)}
                />
              ))}
            </Section>
          )}

          {/* Recents */}
          {recents.length > 0 && (
            <Section title="Recently used" icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />}>
              {recents.map((r, i) => (
                <LocationResultRow
                  key={`rec-${i}`}
                  result={r}
                  distance={distFor(r)}
                  favorited={isFavorite(r)}
                  onPick={() => pick(r)}
                  onToggleFav={() => handleToggleFav(r)}
                />
              ))}
            </Section>
          )}

          {/* Popular in your area */}
          {(popular.length > 0 || popularLoading) && (
            <Section title="Popular in your area" icon={<Flame className="w-3.5 h-3.5 text-accent" />}>
              {popularLoading ? (
                <div className="px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Finding nearby courts…</span>
                </div>
              ) : (
                popular.map((r, i) => (
                  <LocationResultRow
                    key={`pop-${i}`}
                    result={r}
                    distance={distFor(r)}
                    favorited={isFavorite(r)}
                    onPick={() => pick(r)}
                    onToggleFav={() => handleToggleFav(r)}
                  />
                ))
              )}
            </Section>
          )}
        </div>
      )}

      {/* Selected verified location card */}
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

function Section({ title, icon, children }) {
  return (
    <div>
      <div className="px-4 py-2 bg-muted/40 flex items-center gap-1.5 sticky top-0">
        {icon}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}