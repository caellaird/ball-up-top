// Curated reaction set shown in the picker, plus the default emoji used when a
// user taps the primary reaction button. Kept in one place so the feed, picker,
// and stats all stay in sync.
export const REACTION_EMOJIS = ['👍', '🔥', '😂', '❤️', '😮', '👀', '🏀', '💀', '🥶', '🤝'];
export const DEFAULT_REACTION = '🔥';

// Group a list of Like records for one post into { emoji: count }.
export function computeCounts(likes) {
  const counts = {};
  for (const l of likes || []) {
    const e = l.emoji || DEFAULT_REACTION;
    counts[e] = (counts[e] || 0) + 1;
  }
  return counts;
}

// [{ emoji, count }] sorted by count desc then emoji, so the most-used
// reactions always render first and new ones slot in dynamically.
export function sortedReactions(counts) {
  return Object.entries(counts || {})
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}