// Shared city-normalization + yearly leaderboard logic used by backend functions
// (recordGameResult, countCityActivity, getCityLeaderboard) so city attribution
// and the yearly city totals are computed consistently on the server side.

// Normalizes a free-text city string into a consistent key and display format.
// "Durham, NC" → { key: "durham, nc", display: "Durham, NC" }
// "durham"     → { key: "durham",     display: "Durham" }
export function normalizeCity(rawCity: string): { key: string; display: string } {
  const trimmed = (rawCity || '').trim();
  if (!trimmed) return { key: '', display: '' };

  const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  const city = parts[0] || trimmed;
  const state = parts[1] || '';

  const cityLower = city.toLowerCase();
  const stateLower = state.toLowerCase();
  const key = state ? `${cityLower}, ${stateLower}` : cityLower;

  const cityDisplay = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  const stateDisplay = state.toUpperCase();
  const display = state ? `${cityDisplay}, ${stateDisplay}` : cityDisplay;

  return { key, display };
}

// The city competition runs on a calendar-year window.
export function getYearKey(date: Date = new Date()): number {
  return date.getUTCFullYear();
}

// Resolves the city a user represents, from the canonical fields stored by the
// city picker, falling back to their free-text profile city.
export function resolveUserCity(profile: any): { key: string; display: string } {
  const normalized = normalizeCity(profile?.city || '');
  const key = (profile?.city_key || normalized.key || '').trim();
  const display = (profile?.city_display || normalized.display || '').trim();
  return { key, display };
}

// Adds points to the user's city total for the current year.
// Returns the attribution ({ key, display, year }) or null when the user has no city.
export async function awardCityPoints(admin: any, userId: string, points = 1) {
  const profiles = await admin.entities.Profile.filter({ created_by_id: userId });
  const profile = profiles?.[0];
  const { key, display } = resolveUserCity(profile);
  if (!key) return null;

  const year = getYearKey();
  const existing = await admin.entities.CityYearScore.filter({ city_key: key, year });
  const row = existing?.[0];

  if (!row) {
    await admin.entities.CityYearScore.create({
      city_key: key,
      city_display: display || key,
      year,
      points,
    });
  } else {
    await admin.entities.CityYearScore.update(row.id, {
      city_display: display || row.city_display,
      points: (row.points || 0) + points,
    });
  }

  return { key, display: display || key, year };
}