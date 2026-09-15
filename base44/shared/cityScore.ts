// Shared city-normalization + weekly-boundary logic used by backend functions
// (recordGameResult, getCityLeaderboard) so city attribution and leaderboard
// weeks are computed consistently on the server side.

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

// Returns the Monday 00:00:00 (UTC) of the current week as a Date.
// Weekly leaderboard boundary: Monday 12:00 AM through Sunday 11:59 PM.
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

// Returns the ISO string of the current week's Monday start (UTC).
export function getWeekKey(date: Date = new Date()): string {
  return getWeekStart(date).toISOString();
}