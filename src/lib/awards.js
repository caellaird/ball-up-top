// Award display metadata: emoji icon + rarity tier per award type.
export const AWARD_META = {
  MVP: { emoji: '🏆', rarity: 'Legendary' },
  Clutch: { emoji: '💎', rarity: 'Epic' },
  'Ice Cold': { emoji: '🧊', rarity: 'Epic' },
  'Trash Talk King': { emoji: '👑', rarity: 'Epic' },
  'Comeback Player': { emoji: '🔄', rarity: 'Epic' },
  'Best Shooter': { emoji: '🎯', rarity: 'Rare' },
  'Lockdown Defender': { emoji: '🛡️', rarity: 'Rare' },
  Fastest: { emoji: '⚡', rarity: 'Rare' },
  Sharpshooter: { emoji: '🎱', rarity: 'Rare' },
  'Most Improved': { emoji: '📈', rarity: 'Common' },
  Heart: { emoji: '❤️', rarity: 'Common' },
  Respect: { emoji: '🤝', rarity: 'Common' },
  Funny: { emoji: '😂', rarity: 'Common' },
  Competitor: { emoji: '🔥', rarity: 'Common' },
};

export const RARITY_ORDER = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };

// Inline-style color sets for use in html2canvas-captured cards.
export const RARITY_STYLES = {
  Common: { bg: 'rgba(100,116,139,0.18)', text: '#64748b', border: 'rgba(100,116,139,0.35)' },
  Rare: { bg: 'rgba(59,130,246,0.18)', text: '#3b82f6', border: 'rgba(59,130,246,0.35)' },
  Epic: { bg: 'rgba(168,85,247,0.18)', text: '#a855f7', border: 'rgba(168,85,247,0.4)' },
  Legendary: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b', border: 'rgba(245,158,11,0.45)' },
};

// Tailwind class sets for the in-app badge grid (not captured by html2canvas).
export const RARITY_CLASSES = {
  Common: 'bg-slate-100 text-slate-600 border-slate-200',
  Rare: 'bg-blue-50 text-blue-600 border-blue-200',
  Epic: 'bg-purple-50 text-purple-600 border-purple-200',
  Legendary: 'bg-amber-50 text-amber-600 border-amber-200',
};

export function getAwardMeta(type) {
  return AWARD_META[type] || { emoji: '🏅', rarity: 'Common' };
}