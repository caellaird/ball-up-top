import { SPORT_EMOJI, SPORT_LABEL, SPORT_PIN_COLOR } from './constants';

// Matches a free-text "favorite sport" value to a known sport key
// (case-insensitive; matches the key, label, or label substring). Returns the
// key, or null when nothing matches.
export const resolveSportKey = (raw) => {
  if (!raw) return null;
  const value = String(raw).trim().toLowerCase();
  if (!value) return null;
  for (const key of Object.keys(SPORT_EMOJI)) {
    if (key.toLowerCase() === value) return key;
    const label = (SPORT_LABEL[key] || '').toLowerCase();
    if (label && (label === value || label.includes(value))) return key;
  }
  return null;
};

// Two-tone gradient built from the sport's map-pin color.
export const sportGradient = (sportKey) => {
  const hsl = SPORT_PIN_COLOR[sportKey];
  if (!hsl) return null;
  const [h, s, l] = hsl.split(' ').map(Number);
  const top = `hsl(${h} ${s}% ${Math.min(Math.round(l + 14), 60)}%)`;
  const bottom = `hsl(${h} ${s}% ${Math.max(Math.round(l - 22), 14)}%)`;
  return `linear-gradient(135deg, ${top} 0%, ${bottom} 100%)`;
};

// Resolves a favorite-sport value into { key, emoji, label }, or null.
export const getSportDisplay = (raw) => {
  const key = resolveSportKey(raw);
  if (!key) return null;
  return { key, emoji: SPORT_EMOJI[key], label: SPORT_LABEL[key] || key };
};