export const LOGO_URL = 'https://media.base44.com/images/public/6a4b1c30da58082696f047dd/c12d432c5_Screenshot2026-07-07at112237PM.png';

export const SPORTS = [
  { key: 'basketball', label: 'Basketball', emoji: '🏀' },
  { key: 'golf', label: 'Golf', emoji: '⛳' },
  { key: 'pickleball', label: 'Pickleball', emoji: '🥒' },
  { key: 'darts', label: 'Darts', emoji: '🎯' },
  { key: 'disc_golf', label: 'Disc Golf', emoji: '🥏' },
  { key: 'cornhole', label: 'Cornhole', emoji: '🌽' },
  { key: 'trivia', label: 'Trivia', emoji: '🧠' },
  { key: 'chugging', label: 'Chugging', emoji: '🍺' },
  { key: 'custom', label: 'Custom', emoji: '➕' },
];

export const SPORT_EMOJI = SPORTS.reduce((acc, s) => ({ ...acc, [s.key]: s.emoji }), {});

export const AWARD_TYPES = [
  'Clutch', 'Best Shooter', 'Lockdown Defender', 'Trash Talk King', 'Ice Cold',
  'Most Improved', 'Fastest', 'MVP', 'Sharpshooter', 'Comeback Player', 'Heart', 'Respect', 'Funny', 'Competitor',
];

export const SERIES_TYPES = [
  { key: 'single', label: 'Single Challenge' },
  { key: 'bo3', label: 'Best of 3' },
  { key: 'bo5', label: 'Best of 5' },
  { key: 'bo7', label: 'Best of 7' },
  { key: 'open', label: 'Open Series' },
];