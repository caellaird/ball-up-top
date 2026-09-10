// localStorage-backed helpers for recently-used and favorited verified locations.
// Each location object: { name, address, lat, lng }

const RECENTS_KEY = 'but_location_recents';
const FAVS_KEY = 'but_location_favorites';
const MAX_RECENTS = 6;

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

// Two locations match if their coordinates are within ~10 meters.
function sameLocation(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lng - b.lng) < 0.0001;
}

export function getRecents() {
  return read(RECENTS_KEY);
}

export function addRecent(loc) {
  if (!loc?.lat || !loc?.lng) return;
  const list = read(RECENTS_KEY).filter((r) => !sameLocation(r, loc));
  list.unshift({ name: loc.name, address: loc.address, lat: loc.lat, lng: loc.lng });
  write(RECENTS_KEY, list.slice(0, MAX_RECENTS));
}

export function getFavorites() {
  return read(FAVS_KEY);
}

export function isFavorite(loc) {
  return read(FAVS_KEY).some((f) => sameLocation(f, loc));
}

// Returns true if the location is now favorited, false if unfavorited.
export function toggleFavorite(loc) {
  if (!loc?.lat || !loc?.lng) return false;
  const list = read(FAVS_KEY);
  const existing = list.findIndex((f) => sameLocation(f, loc));
  if (existing >= 0) {
    list.splice(existing, 1);
    write(FAVS_KEY, list);
    return false;
  }
  list.unshift({ name: loc.name, address: loc.address, lat: loc.lat, lng: loc.lng });
  write(FAVS_KEY, list);
  return true;
}